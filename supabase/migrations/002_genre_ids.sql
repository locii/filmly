-- Add genre_ids to film_interactions so we can group by genre client-side
ALTER TABLE public.film_interactions
  ADD COLUMN IF NOT EXISTS genre_ids integer[] DEFAULT '{}';  
