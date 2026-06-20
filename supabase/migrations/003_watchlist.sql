-- Rename 'favourite' → 'watchlist', add 'watched' interaction type

-- 1. Drop the old check constraint
ALTER TABLE public.film_interactions
  DROP CONSTRAINT IF EXISTS film_interactions_interaction_check;

-- 2. Migrate existing data
UPDATE public.film_interactions
  SET interaction = 'watchlist'
  WHERE interaction = 'favourite';

-- 3. Add new check constraint with all four types
ALTER TABLE public.film_interactions
  ADD CONSTRAINT film_interactions_interaction_check
  CHECK (interaction IN ('like', 'dislike', 'watchlist', 'watched'));
