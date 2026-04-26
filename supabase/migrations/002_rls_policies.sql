-- ============================================================
-- Liquid Glass — Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = uid AND role = 'ADMIN'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function: check if user is manager or admin
CREATE OR REPLACE FUNCTION public.is_manager_or_admin(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = uid AND role IN ('ADMIN', 'MANAGER')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ─── Profiles Policies ──────────────────────────────────────
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ─── Tasks Policies ─────────────────────────────────────────
CREATE POLICY "Users see own tasks"
  ON public.tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Managers see all tasks"
  ON public.tasks FOR SELECT
  USING (public.is_manager_or_admin(auth.uid()));

CREATE POLICY "Users can insert own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can update all tasks"
  ON public.tasks FOR UPDATE
  USING (public.is_manager_or_admin(auth.uid()));

CREATE POLICY "Users can delete own tasks"
  ON public.tasks FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete all tasks"
  ON public.tasks FOR DELETE
  USING (public.is_admin(auth.uid()));

-- ─── Activity Logs Policies ─────────────────────────────────
CREATE POLICY "Users see own logs"
  ON public.activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins see all logs"
  ON public.activity_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert own logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
