-- ============================================================
-- KanBan AI — Boards & Collaboration
-- ============================================================

DO $$ BEGIN
  CREATE TYPE public.board_role AS ENUM ('OWNER', 'EDITOR', 'VIEWER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_boards_owner_id ON public.boards(owner_id);

CREATE TABLE IF NOT EXISTS public.board_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role public.board_role DEFAULT 'VIEWER' NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  invited_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_board_members_unique ON public.board_members(board_id, user_id);
CREATE INDEX IF NOT EXISTS idx_board_members_user_id ON public.board_members(user_id);

CREATE TABLE IF NOT EXISTS public.board_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role public.board_role DEFAULT 'VIEWER' NOT NULL,
  token TEXT NOT NULL,
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_board_invitations_token ON public.board_invitations(token);
CREATE INDEX IF NOT EXISTS idx_board_invitations_board_id ON public.board_invitations(board_id);
CREATE INDEX IF NOT EXISTS idx_board_invitations_email ON public.board_invitations(email);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_board_id UUID REFERENCES public.boards(id) ON DELETE SET NULL;

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE;
ALTER TABLE public.archived_tasks ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE;
ALTER TABLE public.archived_reports ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE;

INSERT INTO public.boards (id, name, owner_id)
SELECT gen_random_uuid(), 'Mi tablero', p.id
FROM public.profiles p
LEFT JOIN public.boards b ON b.owner_id = p.id
WHERE b.id IS NULL
ON CONFLICT (owner_id) DO NOTHING;

INSERT INTO public.board_members (board_id, user_id, role, status)
SELECT b.id, b.owner_id, 'OWNER', 'active'
FROM public.boards b
LEFT JOIN public.board_members bm ON bm.board_id = b.id AND bm.user_id = b.owner_id
WHERE bm.id IS NULL
ON CONFLICT (board_id, user_id) DO NOTHING;

UPDATE public.profiles p
SET active_board_id = b.id
FROM public.boards b
WHERE b.owner_id = p.id AND p.active_board_id IS NULL;

UPDATE public.tasks t
SET board_id = b.id
FROM public.boards b
WHERE b.owner_id = t.user_id AND t.board_id IS NULL;

UPDATE public.categories c
SET board_id = b.id
FROM public.boards b
WHERE b.owner_id = c.user_id AND c.board_id IS NULL;

UPDATE public.activity_logs l
SET board_id = t.board_id
FROM public.tasks t
WHERE l.task_id = t.id AND l.board_id IS NULL;

UPDATE public.activity_logs l
SET board_id = b.id
FROM public.boards b
WHERE l.user_id = b.owner_id AND l.board_id IS NULL;

UPDATE public.archived_tasks at
SET board_id = b.id
FROM public.boards b
WHERE b.owner_id = at.user_id AND at.board_id IS NULL;

UPDATE public.archived_reports ar
SET board_id = b.id
FROM public.boards b
WHERE b.owner_id = ar.user_id AND ar.board_id IS NULL;

DO $$ BEGIN
  ALTER TABLE public.tasks ALTER COLUMN board_id SET NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.categories ALTER COLUMN board_id SET NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.archived_tasks ALTER COLUMN board_id SET NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.archived_reports ALTER COLUMN board_id SET NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_tasks_board_id ON public.tasks(board_id);
CREATE INDEX IF NOT EXISTS idx_categories_board_id ON public.categories(board_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_board_id ON public.activity_logs(board_id);
CREATE INDEX IF NOT EXISTS idx_archived_tasks_board_id ON public.archived_tasks(board_id);
CREATE INDEX IF NOT EXISTS idx_archived_reports_board_id ON public.archived_reports(board_id);

DROP TRIGGER IF EXISTS boards_updated_at ON public.boards;
CREATE TRIGGER boards_updated_at
  BEFORE UPDATE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.set_board_id_from_profile()
RETURNS TRIGGER AS $$
DECLARE
  resolved_board_id UUID;
BEGIN
  IF NEW.board_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS NOT NULL THEN
    SELECT active_board_id INTO resolved_board_id
    FROM public.profiles
    WHERE id = NEW.user_id;

    IF resolved_board_id IS NULL THEN
      SELECT id INTO resolved_board_id
      FROM public.boards
      WHERE owner_id = NEW.user_id
      LIMIT 1;
    END IF;
  END IF;

  NEW.board_id = resolved_board_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_board_id_for_activity_log()
RETURNS TRIGGER AS $$
DECLARE
  resolved_board_id UUID;
BEGIN
  IF NEW.board_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.task_id IS NOT NULL THEN
    SELECT board_id INTO resolved_board_id
    FROM public.tasks
    WHERE id = NEW.task_id;
  END IF;

  IF resolved_board_id IS NULL AND NEW.user_id IS NOT NULL THEN
    SELECT active_board_id INTO resolved_board_id
    FROM public.profiles
    WHERE id = NEW.user_id;

    IF resolved_board_id IS NULL THEN
      SELECT id INTO resolved_board_id
      FROM public.boards
      WHERE owner_id = NEW.user_id
      LIMIT 1;
    END IF;
  END IF;

  NEW.board_id = resolved_board_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_set_board_id ON public.tasks;
CREATE TRIGGER tasks_set_board_id
  BEFORE INSERT ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_board_id_from_profile();

DROP TRIGGER IF EXISTS categories_set_board_id ON public.categories;
CREATE TRIGGER categories_set_board_id
  BEFORE INSERT ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_board_id_from_profile();

DROP TRIGGER IF EXISTS archived_tasks_set_board_id ON public.archived_tasks;
CREATE TRIGGER archived_tasks_set_board_id
  BEFORE INSERT ON public.archived_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_board_id_from_profile();

DROP TRIGGER IF EXISTS archived_reports_set_board_id ON public.archived_reports;
CREATE TRIGGER archived_reports_set_board_id
  BEFORE INSERT ON public.archived_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_board_id_from_profile();

DROP TRIGGER IF EXISTS activity_logs_set_board_id ON public.activity_logs;
CREATE TRIGGER activity_logs_set_board_id
  BEFORE INSERT ON public.activity_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_board_id_for_activity_log();

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_reports ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_board_owner(uid UUID, bid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.boards b WHERE b.id = bid AND b.owner_id = uid
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_board_member(uid UUID, bid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.board_members bm
    WHERE bm.board_id = bid AND bm.user_id = uid AND bm.status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_board_editor(uid UUID, bid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.board_members bm
    WHERE bm.board_id = bid AND bm.user_id = uid AND bm.status = 'active'
      AND bm.role IN ('OWNER', 'EDITOR')
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.shares_board(uid UUID, other_uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.board_members bm1
    JOIN public.board_members bm2 ON bm1.board_id = bm2.board_id
    WHERE bm1.user_id = uid AND bm2.user_id = other_uid
      AND bm1.status = 'active' AND bm2.status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.shares_board(auth.uid(), id));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users see own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Managers see all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Managers can update all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can delete all tasks" ON public.tasks;

CREATE POLICY "Board members see tasks"
  ON public.tasks FOR SELECT
  USING (public.is_board_member(auth.uid(), board_id));

CREATE POLICY "Board editors insert tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (public.is_board_editor(auth.uid(), board_id));

CREATE POLICY "Board editors update tasks"
  ON public.tasks FOR UPDATE
  USING (public.is_board_editor(auth.uid(), board_id));

CREATE POLICY "Board editors delete tasks"
  ON public.tasks FOR DELETE
  USING (public.is_board_editor(auth.uid(), board_id));

DROP POLICY IF EXISTS "Users see own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.categories;

CREATE POLICY "Board members see categories"
  ON public.categories FOR SELECT
  USING (public.is_board_member(auth.uid(), board_id));

CREATE POLICY "Board editors insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (public.is_board_editor(auth.uid(), board_id));

CREATE POLICY "Board editors update categories"
  ON public.categories FOR UPDATE
  USING (public.is_board_editor(auth.uid(), board_id));

CREATE POLICY "Board editors delete categories"
  ON public.categories FOR DELETE
  USING (public.is_board_editor(auth.uid(), board_id));

DROP POLICY IF EXISTS "Users see own logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Admins see all logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON public.activity_logs;

CREATE POLICY "Board members see activity logs"
  ON public.activity_logs FOR SELECT
  USING (public.is_board_member(auth.uid(), board_id));

CREATE POLICY "Board editors insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (public.is_board_editor(auth.uid(), board_id));

CREATE POLICY "Owners update activity logs"
  ON public.activity_logs FOR UPDATE
  USING (public.is_board_owner(auth.uid(), board_id));

DROP POLICY IF EXISTS "Users see own archived tasks" ON public.archived_tasks;
DROP POLICY IF EXISTS "Users can insert own archived tasks" ON public.archived_tasks;

CREATE POLICY "Board members see archived tasks"
  ON public.archived_tasks FOR SELECT
  USING (public.is_board_member(auth.uid(), board_id));

CREATE POLICY "Board editors insert archived tasks"
  ON public.archived_tasks FOR INSERT
  WITH CHECK (public.is_board_editor(auth.uid(), board_id));

CREATE POLICY "Owners update archived tasks"
  ON public.archived_tasks FOR UPDATE
  USING (public.is_board_owner(auth.uid(), board_id));

DROP POLICY IF EXISTS "Users see own archived reports" ON public.archived_reports;
DROP POLICY IF EXISTS "Users can insert own archived reports" ON public.archived_reports;

CREATE POLICY "Board members see archived reports"
  ON public.archived_reports FOR SELECT
  USING (public.is_board_member(auth.uid(), board_id));

CREATE POLICY "Board editors insert archived reports"
  ON public.archived_reports FOR INSERT
  WITH CHECK (public.is_board_editor(auth.uid(), board_id));

CREATE POLICY "Owners update archived reports"
  ON public.archived_reports FOR UPDATE
  USING (public.is_board_owner(auth.uid(), board_id));

CREATE POLICY "Board members see boards"
  ON public.boards FOR SELECT
  USING (public.is_board_member(auth.uid(), id));

CREATE POLICY "Owners create boards"
  ON public.boards FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners update boards"
  ON public.boards FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners delete boards"
  ON public.boards FOR DELETE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners manage members"
  ON public.board_members FOR ALL
  USING (public.is_board_owner(auth.uid(), board_id))
  WITH CHECK (public.is_board_owner(auth.uid(), board_id));

CREATE POLICY "Members view self"
  ON public.board_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owners manage invitations"
  ON public.board_invitations FOR ALL
  USING (public.is_board_owner(auth.uid(), board_id))
  WITH CHECK (public.is_board_owner(auth.uid(), board_id));

CREATE POLICY "Invited users can view invitations"
  ON public.board_invitations FOR SELECT
  USING (auth.uid() IS NOT NULL AND lower(email) = lower((SELECT email FROM public.profiles WHERE id = auth.uid())));

CREATE OR REPLACE FUNCTION public.ensure_profile_exists()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.ensure_profile_exists();
