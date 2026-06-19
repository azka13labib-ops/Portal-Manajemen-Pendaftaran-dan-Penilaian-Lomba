-- ============================================================
-- PORTAL LOMBA - COMPLETE DATABASE SETUP
-- Jalankan sekali di SQL Editor pada project Supabase baru.
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. TABLES
-- ============================================================

-- User profiles (linked to auth.users)
CREATE TABLE public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  institution   TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Roles: ADMIN, JUDGE, PARTICIPANT
CREATE TABLE public.roles (
  id    SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name  TEXT NOT NULL UNIQUE
);

-- Junction: user <-> role
CREATE TABLE public.user_roles (
  user_id   UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role_id   SMALLINT REFERENCES public.roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- Competition events
CREATE TABLE public.events (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT NOT NULL,
  slug                  TEXT NOT NULL UNIQUE,
  description           TEXT,
  banner_url            TEXT,
  category              TEXT,
  registration_mode     TEXT NOT NULL CHECK (registration_mode IN ('INDIVIDUAL', 'TEAM')),
  team_min_members      SMALLINT DEFAULT 1,
  team_max_members      SMALLINT DEFAULT 1,
  registration_open_at  TIMESTAMPTZ NOT NULL,
  registration_close_at TIMESTAMPTZ NOT NULL,
  submission_close_at   TIMESTAMPTZ NOT NULL,
  announced_at          TIMESTAMPTZ,
  status                TEXT NOT NULL DEFAULT 'DRAFT'
                          CHECK (status IN ('DRAFT','OPEN','SUBMISSION_CLOSED','JUDGING','FINALIZED','ARCHIVED')),
  created_by            UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_slug   ON public.events(slug);

-- Scoring rubric per event
CREATE TABLE public.scoring_criteria (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  weight        NUMERIC(5,2) NOT NULL,
  min_score     NUMERIC(5,2) NOT NULL DEFAULT 0,
  max_score     NUMERIC(5,2) NOT NULL DEFAULT 100,
  display_order SMALLINT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_criteria_event ON public.scoring_criteria(event_id);

-- Teams (for team-mode events)
CREATE TABLE public.teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  name        TEXT NOT NULL,
  description TEXT,
  leader_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Team members
CREATE TABLE public.team_members (
  team_id      UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES public.users(id) ON DELETE RESTRICT,
  status       TEXT NOT NULL DEFAULT 'INVITED'
                 CHECK (status IN ('INVITED','CONFIRMED','DECLINED')),
  invited_at   TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  PRIMARY KEY (team_id, user_id)
);

-- Registrations
CREATE TABLE public.registrations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       UUID NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  team_id        UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  status         TEXT NOT NULL DEFAULT 'PENDING'
                   CHECK (status IN ('PENDING','APPROVED','REJECTED','WITHDRAWN')),
  rejection_note TEXT,
  docs_urls      JSONB DEFAULT '[]',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX idx_registrations_event  ON public.registrations(event_id);
CREATE INDEX idx_registrations_user   ON public.registrations(user_id);
CREATE INDEX idx_registrations_status ON public.registrations(status);

-- Submissions (karya)
CREATE TABLE public.submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL UNIQUE REFERENCES public.registrations(id) ON DELETE RESTRICT,
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  file_url        TEXT,
  file_name       TEXT,
  file_size_bytes BIGINT,
  external_link   TEXT,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'SUBMITTED'
                    CHECK (status IN ('SUBMITTED','DISQUALIFIED')),
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_submissions_event ON public.submissions(event_id);

-- Judging assignments
CREATE TABLE public.judging_assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  judge_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (submission_id, judge_id)
);

CREATE INDEX idx_assignments_judge ON public.judging_assignments(judge_id, event_id);

-- Event judges junction
CREATE TABLE public.event_judges (
  event_id    UUID REFERENCES public.events(id) ON DELETE CASCADE,
  judge_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (event_id, judge_id)
);

-- Scores
CREATE TABLE public.scores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.judging_assignments(id) ON DELETE CASCADE,
  criteria_id   UUID NOT NULL REFERENCES public.scoring_criteria(id) ON DELETE CASCADE,
  raw_score     NUMERIC(6,2) NOT NULL,
  notes         TEXT,
  status        TEXT NOT NULL DEFAULT 'DRAFT'
                  CHECK (status IN ('DRAFT','SUBMITTED')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (assignment_id, criteria_id)
);

CREATE INDEX idx_scores_assignment ON public.scores(assignment_id);

-- Certificates
CREATE TABLE public.certificates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('PARTICIPATION','WINNER')),
  winner_rank     TEXT,
  file_url        TEXT,
  generated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (registration_id)
);

-- ============================================================
-- 3. SEED DATA
-- ============================================================

INSERT INTO public.roles (name)
VALUES ('ADMIN'), ('JUDGE'), ('PARTICIPANT')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 4. FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create public.users row when auth.users gets a new record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, institution, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User Baru'),
    NEW.email,
    NEW.raw_user_meta_data->>'institution',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Assign default PARTICIPANT role
  INSERT INTO public.user_roles (user_id, role_id)
  SELECT NEW.id, id FROM public.roles WHERE name = 'PARTICIPANT'
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Validate that total scoring criteria weight per event does not exceed 100%
CREATE OR REPLACE FUNCTION public.validate_criteria_weights()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  total_weight NUMERIC;
BEGIN
  SELECT COALESCE(SUM(weight), 0) INTO total_weight
  FROM public.scoring_criteria
  WHERE event_id = NEW.event_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  IF (total_weight + NEW.weight) > 100.00 THEN
    RAISE EXCEPTION 'Total bobot kriteria melebihi 100%%. Sisa yang diperbolehkan: %', (100.00 - total_weight);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_criteria_weights ON public.scoring_criteria;
CREATE TRIGGER trg_validate_criteria_weights
  BEFORE INSERT OR UPDATE ON public.scoring_criteria
  FOR EACH ROW EXECUTE FUNCTION public.validate_criteria_weights();

-- ============================================================
-- 5. HELPER FUNCTIONS (used by RLS policies)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id AND r.name = 'ADMIN'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_judge(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id AND r.name = 'JUDGE'
  );
END;
$$;

-- ============================================================
-- 6. VIEWS
-- ============================================================

CREATE OR REPLACE VIEW public.leaderboard_view
WITH (security_invoker = on) AS
SELECT
  s.id            AS submission_id,
  s.event_id,
  r.id            AS registration_id,
  u.full_name     AS participant_name,
  u.institution,
  t.name          AS team_name,
  ROUND(
    AVG((sc_score.raw_score / sc_crit.max_score) * sc_crit.weight)::numeric, 2
  )               AS final_score,
  COUNT(DISTINCT ja.judge_id) AS judges_scored,
  MAX(sc_score.updated_at)    AS last_scored_at,
  cert.winner_rank
FROM public.submissions s
JOIN  public.registrations r       ON r.id    = s.registration_id
JOIN  public.users u               ON u.id    = r.user_id
LEFT JOIN public.teams t           ON t.id    = r.team_id
JOIN  public.judging_assignments ja ON ja.submission_id = s.id
JOIN  public.scores sc_score       ON sc_score.assignment_id = ja.id
                                   AND sc_score.status = 'SUBMITTED'
JOIN  public.scoring_criteria sc_crit ON sc_crit.id = sc_score.criteria_id
LEFT JOIN public.certificates cert ON cert.registration_id = r.id
                                   AND cert.type = 'WINNER'
GROUP BY s.id, s.event_id, r.id, u.full_name, u.institution, t.name, cert.winner_rank
ORDER BY final_score DESC;

-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_criteria  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judging_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_judges      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates      ENABLE ROW LEVEL SECURITY;

-- roles
CREATE POLICY "Public Read Roles"
  ON public.roles FOR SELECT USING (true);

-- users
CREATE POLICY "Users Read Profiles"
  ON public.users FOR SELECT USING (true);
CREATE POLICY "Users Update Own Profile"
  ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin Full Users"
  ON public.users FOR ALL USING (public.is_admin(auth.uid()));

-- user_roles
CREATE POLICY "Users Read Own Roles"
  ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin Full User Roles"
  ON public.user_roles FOR ALL USING (public.is_admin(auth.uid()));

-- events
CREATE POLICY "Public Read Active Events"
  ON public.events FOR SELECT
  USING (
    status IN ('OPEN','SUBMISSION_CLOSED','JUDGING','FINALIZED')
    OR public.is_admin(auth.uid())
    OR public.is_judge(auth.uid())
  );
CREATE POLICY "Admin Full Events"
  ON public.events FOR ALL USING (public.is_admin(auth.uid()));

-- scoring_criteria
CREATE POLICY "Read Scoring Criteria"
  ON public.scoring_criteria FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.events WHERE id = event_id));
CREATE POLICY "Admin Full Scoring Criteria"
  ON public.scoring_criteria FOR ALL USING (public.is_admin(auth.uid()));

-- registrations
CREATE POLICY "Participants Read Own Registrations"
  ON public.registrations FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_id AND tm.user_id = auth.uid()
    )
  );
CREATE POLICY "Participants Insert Own Registrations"
  ON public.registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Participants Update Own Registrations"
  ON public.registrations FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin Full Registrations"
  ON public.registrations FOR ALL USING (public.is_admin(auth.uid()));

-- teams
CREATE POLICY "Read Teams"
  ON public.teams FOR SELECT USING (true);
CREATE POLICY "Insert Team if Leader"
  ON public.teams FOR INSERT WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "Update Team if Leader"
  ON public.teams FOR UPDATE USING (auth.uid() = leader_id);
CREATE POLICY "Admin Full Teams"
  ON public.teams FOR ALL USING (public.is_admin(auth.uid()));

-- team_members
CREATE POLICY "Read Team Members"
  ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Insert Team Members if Leader"
  ON public.team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams WHERE id = team_id AND leader_id = auth.uid()
    )
  );
CREATE POLICY "Update Own Team Member Status"
  ON public.team_members FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin Full Team Members"
  ON public.team_members FOR ALL USING (public.is_admin(auth.uid()));

-- submissions
CREATE POLICY "Participant Read Own Submissions"
  ON public.submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.registrations r
      WHERE r.id = registration_id
        AND (
          r.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = r.team_id AND tm.user_id = auth.uid()
          )
        )
    )
  );
CREATE POLICY "Participant Insert Own Submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.registrations r
      WHERE r.id = registration_id
        AND r.user_id = auth.uid()
        AND r.status = 'APPROVED'
    )
  );
CREATE POLICY "Participant Update Own Submissions"
  ON public.submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.registrations r
      WHERE r.id = registration_id
        AND r.user_id = auth.uid()
        AND r.status = 'APPROVED'
    )
  );
CREATE POLICY "Judge Read Assigned Submissions"
  ON public.submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.judging_assignments
      WHERE judge_id = auth.uid() AND submission_id = id
    )
  );
CREATE POLICY "Admin Full Submissions"
  ON public.submissions FOR ALL USING (public.is_admin(auth.uid()));

-- judging_assignments
CREATE POLICY "Judge Read Assigned"
  ON public.judging_assignments FOR SELECT USING (judge_id = auth.uid());
CREATE POLICY "Admin Full Assignments"
  ON public.judging_assignments FOR ALL USING (public.is_admin(auth.uid()));

-- event_judges
CREATE POLICY "Judge Read Assignments"
  ON public.event_judges FOR SELECT USING (judge_id = auth.uid());
CREATE POLICY "Admin Full Event Judges"
  ON public.event_judges FOR ALL USING (public.is_admin(auth.uid()));

-- scores
CREATE POLICY "Judge Read Own Scores"
  ON public.scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.judging_assignments ja
      WHERE ja.id = assignment_id AND ja.judge_id = auth.uid()
    )
  );
CREATE POLICY "Judge Write Own Scores"
  ON public.scores FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.judging_assignments ja
      WHERE ja.id = assignment_id AND ja.judge_id = auth.uid()
    )
  );
CREATE POLICY "Read Final Scores after Finalized"
  ON public.scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.judging_assignments ja
      JOIN public.events e ON e.id = ja.event_id
      WHERE ja.id = assignment_id AND e.status = 'FINALIZED'
    )
  );
CREATE POLICY "Admin Full Scores"
  ON public.scores FOR ALL USING (public.is_admin(auth.uid()));

-- certificates
CREATE POLICY "User Read Own Certificates"
  ON public.certificates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin Full Certificates"
  ON public.certificates FOR ALL USING (public.is_admin(auth.uid()));

-- ============================================================
-- 8. STORAGE BUCKETS & POLICIES
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('registration-docs', 'registration-docs', true),
  ('submission-files',  'submission-files',  true),
  ('certificates',      'certificates',      true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Access"             ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload registration-docs"  ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload submission-files"   ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload certificates"       ON storage.objects;
DROP POLICY IF EXISTS "Auth Update registration-docs"  ON storage.objects;
DROP POLICY IF EXISTS "Auth Update submission-files"   ON storage.objects;
DROP POLICY IF EXISTS "Auth Update certificates"       ON storage.objects;

CREATE POLICY "Public Read Access"
  ON storage.objects FOR SELECT USING (true);

CREATE POLICY "Auth Upload registration-docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'registration-docs');

CREATE POLICY "Auth Upload submission-files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'submission-files');

CREATE POLICY "Auth Upload certificates"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'certificates');

CREATE POLICY "Auth Update registration-docs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'registration-docs');

CREATE POLICY "Auth Update submission-files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'submission-files');

CREATE POLICY "Auth Update certificates"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'certificates');

-- ============================================================
-- SELESAI! Jalankan query berikut setelah daftar akun admin:
--
-- INSERT INTO public.user_roles (user_id, role_id)
-- SELECT u.id, r.id
-- FROM public.users u CROSS JOIN public.roles r
-- WHERE u.email = 'EMAIL_ANDA@gmail.com'
--   AND r.name  = 'ADMIN'
-- ON CONFLICT DO NOTHING;
-- ============================================================

SELECT 'Portal Lomba database setup complete!' AS status;
