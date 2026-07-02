-- ============================================================
-- PORTAL LOMBA - ADD TARGET AUDIENCE & REQUIRED IDENTITY DOC
-- ============================================================

-- Add new columns to events table
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS target_audience TEXT[] DEFAULT '{"MAHASISWA"}',
  ADD COLUMN IF NOT EXISTS required_identity_document TEXT DEFAULT 'KTM';
