-- ============================================================
-- PORTAL LOMBA - FIX ARCHITECTURE & SECURITY
-- ============================================================

-- 1. Fix Certificates Constraint
-- Currently, certificates table has UNIQUE (registration_id).
-- This means team members cannot get their own certificates.
-- We must drop it and replace it with UNIQUE (registration_id, user_id).
ALTER TABLE public.certificates
  DROP CONSTRAINT IF EXISTS certificates_registration_id_key;

ALTER TABLE public.certificates
  ADD CONSTRAINT certificates_registration_id_user_id_key
  UNIQUE (registration_id, user_id);

-- 2. Fix Registration Update RLS Security Hole
-- Currently, participants can update their own registrations arbitrarily.
-- This allows them to auto-approve themselves by updating the `status` column.
-- We drop the overly permissive policy.
DROP POLICY IF EXISTS "Participants Update Own Registrations" ON public.registrations;

-- And replace it with a more restrictive one:
-- Participants can only update their registration if the status is PENDING or REJECTED.
-- BUT, in our app, the participant doesn't need to UPDATE existing rows from the UI.
-- Wait, the upsert in EventRegisterFormClient needs UPDATE access if it's upserting!
-- Yes, upsert = insert + update.
-- If they upsert, they might update the `status` to PENDING and `docs_urls`.
-- So we allow update, but restrict what can be updated using a trigger.
-- However, an easier way is to just let Admin approve. But what if they try to set status to APPROVED?
-- Let's create a trigger to prevent non-admins from changing status to APPROVED.

CREATE OR REPLACE FUNCTION public.protect_registration_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is not an admin, and they are trying to set status to APPROVED or REJECTED
  IF NOT public.is_admin(auth.uid()) THEN
    -- If the new status is APPROVED, force it back to PENDING
    IF NEW.status IN ('APPROVED', 'REJECTED') THEN
      NEW.status := 'PENDING';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_registration_status ON public.registrations;
CREATE TRIGGER trg_protect_registration_status
  BEFORE UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_registration_status();

-- 3. Re-enable the Update Policy but safely
CREATE POLICY "Participants Update Own Registrations"
  ON public.registrations FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Enable members to see their own team registrations via SELECT policy
-- (The existing SELECT policy already covers team_members checking!)
