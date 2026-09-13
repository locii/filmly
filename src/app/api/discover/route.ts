import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { tmdb } from "@/lib/tmdb";
import { Film, TMDBResponse } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const anthropic = new Anthropic();

/**
 * Ceiling, not a target. The model is told to return fewer when fewer films
 * genuinely fit — asking for a fixed count was the main source of weak results,
 * because a narrow query ("Norwegian slow cinema") has nowhere near 100 real
 * matches and the model padded to hit the number.
 */
const MAX_TITLES = 60;

/** TMDB noise floor: too few votes and the rating is meaningless. */
const MIN_VOTE_COUNT = 50;
/** Above this, a title is almost always an obscure entry with inflated votes. */
const MAX_VOTE_AVERAGE = 9.4;

async function getTitlesFromClaude(query: string): Promise<string[]> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    output_config: { effort: "low" },
    messages: [{
      role: "user",
      content: `You are an expert film curator. A user wants: "${query}"

Return real theatrical feature films that genuinely match, strongest match first.

Rules:
- ONLY films — no TV shows, no mini-series, no short films
- Order matters. The best match comes first, and relevance must not decay down
  the list. Stop as soon as the matches stop being good ones.
- Return AT MOST ${MAX_TITLES}, and fewer whenever fewer genuinely fit. Twenty
  strong matches is a better answer than sixty where the last forty are vague.
  Never pad the list to reach a number.
- Among the films that genuinely fit, vary tone, decade, country and budget —
  blockbusters, indies, foreign-language films and documentaries all welcome.
  Relevance always wins over variety; never trade a good match for a broader one.
- Always add the release year in brackets after the title: "Title (YEAR)"

Respond with ONLY a valid JSON array, nothing else:
["Film Title (1999)", "Another Film (2008)", ...]`,
    }],
  });

  const text = message.content.find((b) => b.type === "text")?.text ?? "[]";
  const match = text.match(/\[[\s\S]*\]/)?.[0] ?? "[]";
  const parsed = JSON.parse(match);
  if (!Array.isArray(parsed)) return [];

  // The model occasionally repeats a title; dedupe before spending a TMDB
  // lookup on it, keeping the first (highest-ranked) occurrence.
  const seenTitles = new Set<string>();
  return parsed
    .filter((t): t is string => typeof t === "string")
    .filter((t) => {
      const key = t.trim().toLowerCase();
      if (!key || seenTitles.has(key)) return false;
      seenTitles.add(key);
      return true;
    })
    .slice(0, MAX_TITLES);
}

async function lookupFilm(raw: string): Promise<Film | null> {
  const yearMatch = raw.match(/^(.+?)\s*\((\d{4})\)\s*$/);
  const title = yearMatch ? yearMatch[1].trim() : raw.trim();
  const year = yearMatch ? yearMatch[2] : null;

  try {
    const res = await tmdb.search(title, "1") as TMDBResponse<Film>;
    const results = res.results ?? [];
    if (results.length === 0) return null;

    if (year) {
      const byYear = results.find((f) => f.release_date?.startsWith(year));
      if (byYear) return byYear;
    }

    return results.find((f) => f.title.toLowerCase() === title.toLowerCase()) ?? results[0];
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  // This endpoint spends real money/CPU (an LLM call + up to MAX_TITLES TMDB
  // lookups per request). Discover is a signed-in feature, so require a session
  // and cap the rate to stop a single user (or leaked cookie) hammering it.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ type: "error", message: "Sign in to use Discover" }), { status: 401 });
  }
  const limit = rateLimit(`discover:${user.id}`, 10, 60_000);
  if (!limit.ok) {
    return new Response(
      JSON.stringify({ type: "error", message: "Slow down — too many requests" }),
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const { query } = await request.json();
  if (!query?.trim()) {
    return new Response(JSON.stringify({ type: "error", message: "Query required" }), { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      try {
        const titles = await getTitlesFromClaude(query.trim());

        send({ type: "total", count: titles.length });

        // Every lookup starts at once (map is eager, so the fan-out is as
        // concurrent as it ever was), but results are awaited and emitted in
        // the model's ranking order. Promise.all used to emit in whatever
        // order TMDB happened to answer, which scattered the strongest matches
        // through the grid and made the results feel arbitrary.
        const lookups = titles.map((title) => lookupFilm(title));

        const seen = new Set<number>();
        for (const lookup of lookups) {
          const film = await lookup;
          if (!film || seen.has(film.id)) continue;
          if ((film.vote_count ?? 0) < MIN_VOTE_COUNT) continue;
          if (film.vote_average >= MAX_VOTE_AVERAGE) continue;

          seen.add(film.id);
          send({ type: "film", data: film });
        }
      } catch (err) {
        send({ type: "error", message: String(err) });
      } finally {
        send({ type: "done" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
