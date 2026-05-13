export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  education: string | null
  optional_subject: string | null
  attempts: number | null
  stage_reached: string | null
  interests: string[] | null
  skills: string[] | null
  priorities: Record<string, unknown> | null
  resume_url: string | null
  assessment_completed: boolean
  role: 'user' | 'admin' | 'editor'
  created_at: string
  updated_at: string
}

export interface TrajectoryStage {
  stage: string
  title: string
  years: string
  salary: string
  responsibilities: string[]
}

export interface Course {
  name: string
  provider: string
  url: string
  cost: string
  duration: string
}

export interface LaunchpadWeek {
  week: number
  title: string
  tasks: string[]
}

export interface YoutubeLink {
  title: string
  url: string
  channel: string
}

export interface PodcastLink {
  title: string
  url: string
  host: string
}

export interface LinkedinGroup {
  name: string
  url: string
}

export interface CareerPath {
  id: string
  domain: string
  title: string
  slug: string
  description: string | null
  overview: string | null
  trajectory: TrajectoryStage[] | null
  salary_entry: string | null
  salary_mid: string | null
  salary_senior: string | null
  perks: string[] | null
  impact: string | null
  exposure: string | null
  eligibility: string | null
  skills_needed: string[] | null
  upsc_skill_mapping: string | null
  difficulty_rating: number | null
  growth_rate: string | null
  courses: Course[] | null
  certifications: string[] | null
  portfolio_projects: string[] | null
  launchpad_weeks: LaunchpadWeek[] | null
  estimated_cost: string | null
  how_to_apply: string | null
  youtube_links: YoutubeLink[] | null
  podcast_links: PodcastLink[] | null
  linkedin_groups: LinkedinGroup[] | null
  professional_associations: string[] | null
  is_active: boolean
  status: 'draft' | 'published'
  created_at: string
}

export interface UserCareerMatch {
  id: string
  user_id: string
  career_path_id: string
  match_percentage: number | null
  is_pinned: boolean
  explored: boolean
  created_at: string
  career_paths?: CareerPath
}

export interface Story {
  id: string
  person_name: string | null
  is_anonymous: boolean
  current_role: string | null
  company: string | null
  optional_subject: string | null
  num_attempts: number | null
  career_path_id: string | null
  story_text: string | null
  video_url: string | null
  source_url: string | null
  source_platform: string | null
  photo_url: string | null
  is_approved: boolean
  created_at: string
}

export interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

export interface CareerMatchResult {
  career_path_id: string
  match_percentage: number
  reasoning: string
  career?: CareerPath
}

export interface AssessmentUserData {
  name: string
  education: string
  optional: string
  attempts: number
  stage: string
  interests: string[]
  skills: string[]
  priorities: string[]
  constraints: string
}
