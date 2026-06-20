import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { tmdb } from "@/lib/tmdb";
import { Film, TMDBResponse } from "@/lib/types";

const anthropic = new Anthropic();

async function getTitlesFromClaude(query: string): Promise<string[]> {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [{
      role: "user",
      content: `You are a film expert. A user wants to find films matching this description: "${query}"

List 15 real films that closely match. Prioritise well-known films with wide availability.

Respond with ONLY a JSON array of film titles, no explanation:
["Title One", "Title Two", "Title Three", ...]`,
    }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "[]";
  const match = text.match(/\[[\s\S]*\]/)?.[0] ?? "[]";
  const parsed = JSON.parse(match);
  return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === "string") : [];
}

async function lookupFilm(title: string): Promise<Film | null> {
  try {
    const res = await tmdb.search(title, "1") as TMDBResponse<Film>;
    const results = res.results ?? [];
    if (results.length === 0) return null;

    // Prefer exact title match, otherwise take the most popular result
    const exact = results.find(
      (f) => f.title.toLowerCase() === title.toLowerCase()
    );
    return exact ?? results[0];
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    if (!query?.trim()) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    // Step 1: Ask Claude to name matching films
    const titles = await getTitlesFromClaude(query.trim());
    if (titles.length === 0) {
      return NextResponse.json({ films: [], titles: [] });
    }

    // Step 2: Look up each title on TMDB (in parallel)
    const lookups = await Promise.all(titles.map(lookupFilm));

    // Step 3: Dedupe by TMDB id, drop nulls
    const seen = new Set<number>();
    const films: Film[] = [];
    for (const film of lookups) {
      if (film && !seen.has(film.id)) {
        seen.add(film.id);
        films.push(film);
      }
    }

    return NextResponse.json({ films, titles });
  } catch (err) {
    console.error("[discover] error:", err);
    return NextResponse.json({ error: "Discovery failed" }, { status: 500 });
  }
}
