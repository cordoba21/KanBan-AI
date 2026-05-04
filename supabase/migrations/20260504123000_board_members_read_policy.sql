-- Allow all active board members to read collaborators
create policy "Members can read board members"
on public.board_members
for select
using (
  exists (
    select 1
    from public.board_members as bm
    where bm.board_id = board_members.board_id
      and bm.user_id = auth.uid()
      and bm.status = 'active'
  )
);
