  -- ============================================================
  -- PORTAL LOMBA - FIX PHASE 2 (DEADLINES & SCORE BOUNDARIES)
  -- ============================================================

  -- ------------------------------------------------------------
  -- 1. Enforce Event Registration Deadlines
  -- ------------------------------------------------------------
  CREATE OR REPLACE FUNCTION public.check_registration_deadlines()
  RETURNS TRIGGER AS $$
  DECLARE
    v_open_at TIMESTAMPTZ;
    v_close_at TIMESTAMPTZ;
    v_status TEXT;
  BEGIN
    -- We don't enforce deadlines on Admins
    IF public.is_admin(auth.uid()) THEN
      RETURN NEW;
    END IF;

    SELECT registration_open_at, registration_close_at, status 
    INTO v_open_at, v_close_at, v_status
    FROM public.events WHERE id = NEW.event_id;

    -- Must be in OPEN state
    IF v_status != 'OPEN' THEN
      RAISE EXCEPTION 'Pendaftaran untuk event ini sedang ditutup atau tidak aktif.';
    END IF;

    -- Time boundary check
    IF NOW() < v_open_at THEN
      RAISE EXCEPTION 'Pendaftaran untuk event ini belum dibuka.';
    END IF;
    
    IF NOW() > v_close_at THEN
      RAISE EXCEPTION 'Pendaftaran untuk event ini sudah ditutup.';
    END IF;

    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  DROP TRIGGER IF EXISTS trg_enforce_registration_deadlines ON public.registrations;
  CREATE TRIGGER trg_enforce_registration_deadlines
    BEFORE INSERT OR UPDATE ON public.registrations
    FOR EACH ROW
    EXECUTE FUNCTION public.check_registration_deadlines();

  -- ------------------------------------------------------------
  -- 2. Enforce Submission Deadlines
  -- ------------------------------------------------------------
  CREATE OR REPLACE FUNCTION public.check_submission_deadlines()
  RETURNS TRIGGER AS $$
  DECLARE
    v_close_at TIMESTAMPTZ;
    v_event_status TEXT;
    v_event_id UUID;
  BEGIN
    -- We don't enforce deadlines on Admins
    IF public.is_admin(auth.uid()) THEN
      RETURN NEW;
    END IF;

    -- Get event_id through registrations
    SELECT event_id INTO v_event_id FROM public.registrations WHERE id = NEW.registration_id;

    SELECT submission_close_at, status 
    INTO v_close_at, v_event_status
    FROM public.events WHERE id = v_event_id;

    -- Must be OPEN status to submit
    IF v_event_status != 'OPEN' THEN
      RAISE EXCEPTION 'Pengumpulan karya tidak diizinkan pada status event saat ini.';
    END IF;

    -- Time boundary check
    IF NOW() > v_close_at THEN
      RAISE EXCEPTION 'Batas waktu pengumpulan karya sudah lewat.';
    END IF;

    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  DROP TRIGGER IF EXISTS trg_enforce_submission_deadlines ON public.submissions;
  CREATE TRIGGER trg_enforce_submission_deadlines
    BEFORE INSERT OR UPDATE ON public.submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.check_submission_deadlines();


  -- ------------------------------------------------------------
  -- 3. Validate Score Boundaries
  -- ------------------------------------------------------------
  CREATE OR REPLACE FUNCTION public.validate_score_bounds()
  RETURNS TRIGGER AS $$
  DECLARE
    v_min_score NUMERIC(5,2);
    v_max_score NUMERIC(5,2);
  BEGIN
    -- Fetch min and max from the rubric criteria
    SELECT min_score, max_score INTO v_min_score, v_max_score
    FROM public.scoring_criteria
    WHERE id = NEW.criteria_id;

    -- Guard check
    IF NEW.raw_score < v_min_score THEN
      RAISE EXCEPTION 'Nilai (%) kurang dari batas minimum (%).', NEW.raw_score, v_min_score;
    END IF;

    IF NEW.raw_score > v_max_score THEN
      RAISE EXCEPTION 'Nilai (%) melebihi batas maksimum (%).', NEW.raw_score, v_max_score;
    END IF;

    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  DROP TRIGGER IF EXISTS trg_validate_score_bounds ON public.scores;
  CREATE TRIGGER trg_validate_score_bounds
    BEFORE INSERT OR UPDATE ON public.scores
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_score_bounds();
