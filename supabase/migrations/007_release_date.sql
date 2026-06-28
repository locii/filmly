-- Persist each film's release date on the interaction so watchlist cards can
-- show the year without a separate /api/films/ratings backfill call.
-- Stored as text since TMDB returns "YYYY-MM-DD" (and occasionally "").

ALTER TABLE public.film_interactions
  ADD COLUMN IF NOT EXISTS release_date text;
