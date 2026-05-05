-- Allow multiple boards per owner
DROP INDEX IF EXISTS public.idx_boards_owner_id;
CREATE INDEX IF NOT EXISTS idx_boards_owner_id ON public.boards(owner_id);
