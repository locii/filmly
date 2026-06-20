import { NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";

export async function GET() {
  try {
    const data = await tmdb.genres();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Genres error:", err);
    return NextResponse.json({ error: "Failed to fetch genres" }, { status: 500 });
  }
}
