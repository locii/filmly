-- "Up Next" queue for the watchlist.
-- A non-null queue_position marks a watchlist film as queued; the queue is
-- ordered by queue_position ascending. NULL means "not in the queue".

ALTER TABLE public.film_interactions
  ADD COLUMN IF NOT EXISTS queue_position integer;

-- Fast ordering of a user's queue.
CREATE INDEX IF NOT EXISTS film_interactions_queue_idx
  ON public.film_interactions (user_id, queue_position)
  WHERE queue_position IS NOT NULL;

-- Reordering the queue requires UPDATE, which the original policies didn't grant.
DROP POLICY IF EXISTS "Users can update own interactions" ON public.film_interactions;
CREATE POLICY "Users can update own interactions"
  ON public.film_interactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
