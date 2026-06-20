-- Update existing foreign key constraints to ON DELETE CASCADE
-- This ensures that when an event is deleted, all related teams and registrations are also deleted automatically.

-- Update teams table
ALTER TABLE public.teams
  DROP CONSTRAINT IF EXISTS teams_event_id_fkey;

ALTER TABLE public.teams
  ADD CONSTRAINT teams_event_id_fkey 
  FOREIGN KEY (event_id) 
  REFERENCES public.events(id) 
  ON DELETE CASCADE;

-- Update registrations table
ALTER TABLE public.registrations
  DROP CONSTRAINT IF EXISTS registrations_event_id_fkey;

ALTER TABLE public.registrations
  ADD CONSTRAINT registrations_event_id_fkey 
  FOREIGN KEY (event_id) 
  REFERENCES public.events(id) 
  ON DELETE CASCADE;
