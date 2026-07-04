export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Competition {
  id: string
  name: string
  description: string | null
  slug: string
  logo_url: string | null
  is_active: boolean
  created_at: string
}

export type PhaseStatus = 'draft' | 'open_registration' | 'active' | 'finished'

export interface Phase {
  id: string
  competition_id: string
  name: string
  slug: string
  entry_fee: number
  status: PhaseStatus
  start_at: string | null
  end_at: string | null
  created_at: string
}

export type EntryStatus = 'pending' | 'paid' | 'refunded'

export interface Entry {
  id: string
  user_id: string
  phase_id: string
  status: EntryStatus
  stripe_session_id: string | null
  paid_at: string | null
  points_total: number
  created_at: string
  profile?: Profile
  phase?: Phase
}

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed'

export interface Match {
  id: string
  phase_id: string
  home_team: string
  away_team: string
  home_score: number | null
  away_score: number | null
  status: MatchStatus
  start_at: string
  created_at: string
}

export interface Prediction {
  id: string
  user_id: string
  match_id: string
  home_prediction: number
  away_prediction: number
  points_earned: number | null
  created_at: string
  updated_at: string
  match?: Match
  profile?: Profile
}
