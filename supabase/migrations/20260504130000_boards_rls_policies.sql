-- RLS policies for boards table

-- Policy to allow any authenticated user to create a board
create policy "Users can create boards"
on public.boards
for insert
with check (auth.uid() = owner_id);

-- Policy to allow members to read their boards
create policy "Members can read boards"
on public.boards
for select
using (
  exists (
    select 1 from public.board_members
    where board_id = boards.id
      and user_id = auth.uid()
      and status = 'active'
  )
);

-- Policy to allow owners to update their boards
create policy "Owners can update boards"
on public.boards
for update
using (auth.uid() = owner_id);

-- Policy to allow owners to delete their boards
create policy "Owners can delete boards"
on public.boards
for delete
using (auth.uid() = owner_id);