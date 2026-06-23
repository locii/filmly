-- Let owners manage their own stacks: update + delete (read + create already exist in 004)

alter table public.published_stacks
  add column if not exists updated_at timestamptz default now();

-- Only the creator can edit their stack
create policy "Owners can update their stacks"
  on public.published_stacks for update
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- Only the creator can delete their stack
create policy "Owners can delete their stacks"
  on public.published_stacks for delete
  using (auth.uid() = created_by);
