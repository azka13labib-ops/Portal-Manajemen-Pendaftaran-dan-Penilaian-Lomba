export type UserRole = 'ADMIN' | 'JUDGE' | 'PARTICIPANT';

export type EventStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'SUBMISSION_CLOSED'
  | 'JUDGING'
  | 'FINALIZED'
  | 'ARCHIVED';

export type RegistrationMode = 'INDIVIDUAL' | 'TEAM';

export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

export type SubmissionStatus = 'SUBMITTED' | 'DISQUALIFIED';

export type ScoreStatus = 'DRAFT' | 'SUBMITTED';

export type CertificateType = 'PARTICIPATION' | 'WINNER';

export type WinnerRank =
  | 'JUARA_1'
  | 'JUARA_2'
  | 'JUARA_3'
  | 'HARAPAN_1'
  | 'HARAPAN_2'
  | 'HARAPAN_3';

export type TeamMemberStatus = 'INVITED' | 'CONFIRMED' | 'DECLINED';

// ============================================================
// Database Row Types
// ============================================================

export interface User {
  id: string;
  full_name: string;
  email: string;
  institution: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: UserRole;
}

export interface UserRoleRow {
  user_id: string;
  role_id: number;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  banner_url: string | null;
  category: string | null;
  registration_mode: RegistrationMode;
  team_min_members: number;
  team_max_members: number;
  registration_open_at: string;
  registration_close_at: string;
  submission_close_at: string;
  announced_at: string | null;
  status: EventStatus;
  created_by: string | null;
  target_audience: string[] | null;
  required_identity_document: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScoringCriteria {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  weight: number;
  min_score: number;
  max_score: number;
  display_order: number;
  created_at: string;
}

export interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  team_id: string | null;
  status: RegistrationStatus;
  rejection_note: string | null;
  docs_urls: DocFile[];
  created_at: string;
  updated_at: string;
  // Joined
  user?: User;
  event?: Event;
  team?: Team;
}

export interface DocFile {
  name: string;
  url: string;
  uploaded_at: string;
}

export interface Team {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  leader_id: string;
  created_at: string;
  // Joined
  members?: TeamMember[];
  leader?: User;
}

export interface TeamMember {
  team_id: string;
  user_id: string;
  status: TeamMemberStatus;
  invited_at: string;
  confirmed_at: string | null;
  // Joined
  user?: User;
}

export interface Submission {
  id: string;
  registration_id: string;
  event_id: string;
  file_url: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  external_link: string | null;
  description: string | null;
  status: SubmissionStatus;
  submitted_at: string;
  updated_at: string;
  // Joined
  registration?: Registration;
}

export interface JudgingAssignment {
  id: string;
  event_id: string;
  submission_id: string;
  judge_id: string;
  assigned_at: string;
  // Joined
  submission?: Submission;
  judge?: User;
}

export interface Score {
  id: string;
  assignment_id: string;
  criteria_id: string;
  raw_score: number;
  notes: string | null;
  status: ScoreStatus;
  created_at: string;
  updated_at: string;
  // Joined
  criteria?: ScoringCriteria;
}

export interface Certificate {
  id: string;
  registration_id: string;
  event_id: string;
  user_id: string;
  type: CertificateType;
  winner_rank: WinnerRank | null;
  file_url: string | null;
  generated_at: string;
}

export interface EventJudge {
  event_id: string;
  judge_id: string;
  assigned_by: string | null;
  assigned_at: string;
  // Joined
  judge?: User;
}

// ============================================================
// Leaderboard View
// ============================================================

export interface LeaderboardEntry {
  submission_id: string;
  event_id: string;
  registration_id: string;
  participant_name: string;
  institution: string | null;
  team_name: string | null;
  final_score: number;
  judges_scored: number;
  last_scored_at: string | null;
  // Admin-set winner info
  winner_rank?: WinnerRank | null;
}

// ============================================================
// Form Types
// ============================================================

export interface EventFormData {
  title: string;
  description: string;
  category: string;
  registration_mode: RegistrationMode;
  team_min_members: number;
  team_max_members: number;
  registration_open_at: string;
  registration_close_at: string;
  submission_close_at: string;
  announced_at: string;
  banner_url?: string;
}

export interface CriteriaFormData {
  name: string;
  description: string;
  weight: number;
  min_score: number;
  max_score: number;
  display_order: number;
}

export interface ScoreFormEntry {
  criteria_id: string;
  raw_score: number;
  notes: string;
}

// ============================================================
// UI / Component Types
// ============================================================

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number;
}

export interface StatCard {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
  color?: 'blue' | 'teal' | 'gold' | 'neutral';
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}
