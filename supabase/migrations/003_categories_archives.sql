-- ============================================================
-- KanBan AI — Categories, Task Enhancements & Archives
-- ============================================================

-- ─── Categories ─────────────────────────────────────────────
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#7dd3fc',
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_categories_user_id ON public.categories(user_id);

-- Add category + due_date to tasks
ALTER TABLE public.tasks ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN due_date TIMESTAMPTZ;

CREATE INDEX idx_tasks_category_id ON public.tasks(category_id);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- ─── Archived Tasks ────────────────────────────────────────
CREATE TABLE public.archived_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_task_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  priority INT DEFAULT 0,
  category_name TEXT,
  category_color TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id),
  due_date TIMESTAMPTZ,
  task_created_at TIMESTAMPTZ,
  task_completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ DEFAULT now(),
  archive_month TEXT NOT NULL -- e.g. '2026-04'
);

CREATE INDEX idx_archived_tasks_user_id ON public.archived_tasks(user_id);
CREATE INDEX idx_archived_tasks_month ON public.archived_tasks(archive_month);

-- ─── Archived Reports ──────────────────────────────────────
CREATE TABLE public.archived_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  report_month TEXT NOT NULL, -- e.g. '2026-04'
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  task_count INT DEFAULT 0,
  completed_count INT DEFAULT 0,
  completion_rate REAL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_archived_reports_user_id ON public.archived_reports(user_id);
CREATE INDEX idx_archived_reports_month ON public.archived_reports(report_month);

-- ─── Auto-update triggers ──────────────────────────────────
CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── RLS Policies ───────────────────────────────────────────
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_reports ENABLE ROW LEVEL SECURITY;

-- Categories
CREATE POLICY "Users see own categories"
  ON public.categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id);

-- Archived Tasks
CREATE POLICY "Users see own archived tasks"
  ON public.archived_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own archived tasks"
  ON public.archived_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Archived Reports
CREATE POLICY "Users see own archived reports"
  ON public.archived_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own archived reports"
  ON public.archived_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);
