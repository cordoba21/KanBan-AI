-- RLS policies for board_members table

-- Policy to allow users to create their own membership (when creating a board)
create policy "Users can insert their own membership"
on public.board_members
for insert
with check (auth.uid() = user_id);

-- Policy to allow members to read all members of their boards (already added in previous migration)

-- Policy to allow users to update their own membership role
create policy "Users can update their membership"
on public.board_members
for update
using (auth.uid() = user_id);

-- Policy to allow users to delete their own membership (revoke)
create policy "Users can delete their membership"
on public.board_members
for delete
using (auth.uid() = user_id);