import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { tmdb } from "@/lib/tmdb";
import { Film, TMDBResponse } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const anthropic = new Anthropic();

async function getTitlesFromClaude(query: string): Promise<string[]> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: `You are an expert film curator. A user wants: "${query}"

Give me 100 real theatrical films that match. Rules:
- ONLY films — no TV shows, no mini-series, no short films
- Cover blockbusters, indie films, foreign language films, and documentaries
- Include different tones: drama, dark comedy, thriller, action, documentary
- Span multiple decades and countries where relevant
- Always add the release year in brackets after the title: "Title (YEAR)"
- Be specific and confident — don't pad with vague matches

Respond with ONLY a valid JSON array, nothing else:
["Film Title (1999)", "Another Film (2008)", ...]`,
    }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "[]";
  const match = text.match(/\[[\s\S]*\]/)?.[0] ?? "[]";
  const parsed = JSON.parse(match);
  return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === "string") : [];
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
  // This endpoint spends real money/CPU (an LLM call + ~100 TMDB lookups per
  // request). Discover is a signed-in feature, so require a session and cap the
  // rate to stop a single user (or leaked cookie) hammering it.
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

        const seen = new Set<number>();
        await Promise.all(
          titles.map(async (title) => {
            const film = await lookupFilm(title);
            if (
              film &&
              !seen.has(film.id) &&
              (film.vote_count ?? 0) >= 50 &&
              film.vote_average < 9.4
            ) {
              seen.add(film.id);
              send({ type: "film", data: film });
            }
          })
        );
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
