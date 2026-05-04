create table if not exists public.task_assignees (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now() not null
);

create index if not exists task_assignees_task_id_idx on public.task_assignees(task_id);
create index if not exists task_assignees_user_id_idx on public.task_assignees(user_id);

alter table public.task_assignees enable row level security;

create policy "Members can read task assignees"
on public.task_assignees
for select
using (
  exists (
    select 1
    from public.tasks
    join public.board_members on board_members.board_id = tasks.board_id
    where tasks.id = task_assignees.task_id
      and board_members.user_id = auth.uid()
      and board_members.status = 'active'
  )
);

create policy "Editors can insert task assignees"
on public.task_assignees
for insert
with check (
  exists (
    select 1
    from public.tasks
    join public.board_members on board_members.board_id = tasks.board_id
    where tasks.id = task_assignees.task_id
      and board_members.user_id = auth.uid()
      and board_members.status = 'active'
      and board_members.role in ('OWNER', 'EDITOR')
  )
);

create policy "Editors can delete task assignees"
on public.task_assignees
for delete
using (
  exists (
    select 1
    from public.tasks
    join public.board_members on board_members.board_id = tasks.board_id
    where tasks.id = task_assignees.task_id
      and board_members.user_id = auth.uid()
      and board_members.status = 'active'
      and board_members.role in ('OWNER', 'EDITOR')
  )
);

-- Optional: backfill from tasks.assigned_to (one-to-one legacy)
insert into public.task_assignees (task_id, user_id)
select id, assigned_to
from public.tasks
where assigned_to is not null
on conflict do nothing;
