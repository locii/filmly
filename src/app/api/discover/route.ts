import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { tmdb } from "@/lib/tmdb";
import { Film, TMDBResponse } from "@/lib/types";

const anthropic = new Anthropic();

interface DiscoverParams {
  genre_ids: number[];
  keywords: string[];
  min_year?: number;
  max_year?: number;
  min_rating?: number;
  sort_by?: string;
}

async function parseQuery(query: string): Promise<DiscoverParams> {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{
      role: "user",
      content: `You are a film recommendation assistant. Parse this natural language film request into TMDB API parameters.

Request: "${query}"

Respond with ONLY valid JSON, no explanation:
{
  "genre_ids": [array of TMDB genre IDs from: Action=28, Adventure=12, Animation=16, Comedy=35, Crime=80, Documentary=99, Drama=18, Family=10751, Fantasy=14, History=36, Horror=27, Music=10402, Mystery=9648, Romance=10749, SciFi=878, Thriller=53, War=10752, Western=37],
  "keywords": [2-4 specific TMDB keyword strings that match the mood/theme, e.g. "neo-noir", "anti-hero", "psychological thriller"],
  "min_year": optional number or null,
  "max_year": optional number or null,
  "min_rating": optional number 1-10 or null,
  "sort_by": "popularity.desc" or "vote_average.desc" or "release_date.desc" (default popularity.desc)
}`
    }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "{}";
  const json = text.match(/\{[\s\S]*\}/)?.[0] ?? "{}";
  return JSON.parse(json);
}

async function resolveKeywords(keywords: string[]): Promise<number[]> {
  const ids: number[] = [];
  await Promise.all(
    keywords.map(async (kw) => {
      try {
        const res = await tmdb.searchKeywords(kw) as { results: { id: number; name: string }[] };
        if (res.results?.[0]) ids.push(res.results[0].id);
      } catch {
        // keyword not found — skip
      }
    })
  );
  return ids;
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    if (!query?.trim()) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    const params = await parseQuery(query.trim());
    const keywordIds = await resolveKeywords(params.keywords ?? []);

    const discoverParams: Record<string, string> = {
      sort_by: params.sort_by ?? "popularity.desc",
      include_adult: "false",
      "vote_count.gte": "50",
    };

    if (params.genre_ids?.length) {
      discoverParams.with_genres = params.genre_ids.join(",");
    }
    if (keywordIds.length) {
      discoverParams.with_keywords = keywordIds.join(",");
    }
    if (params.min_year) {
      discoverParams["primary_release_date.gte"] = `${params.min_year}-01-01`;
    }
    if (params.max_year) {
      discoverParams["primary_release_date.lte"] = `${params.max_year}-12-31`;
    }
    if (params.min_rating) {
      discoverParams["vote_average.gte"] = String(params.min_rating);
    }

    const results = await tmdb.discover(discoverParams) as TMDBResponse<Film>;

    return NextResponse.json({
      films: results.results,
      parsed: { ...params, keyword_ids: keywordIds },
    });
  } catch (err) {
    console.error("[discover] error:", err);
    return NextResponse.json({ error: "Discovery failed" }, { status: 500 });
  }
}
