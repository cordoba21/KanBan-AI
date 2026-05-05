-- Add soft delete + board name snapshot to archived reports
ALTER TABLE public.archived_reports
ADD COLUMN IF NOT EXISTS board_name TEXT,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE public.archived_reports ar
SET board_name = b.name
FROM public.boards b
WHERE ar.board_id = b.id
  AND ar.board_name IS NULL;

CREATE INDEX IF NOT EXISTS idx_archived_reports_deleted_at ON public.archived_reports(deleted_at);
