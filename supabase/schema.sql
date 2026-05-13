-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  education TEXT,
  optional_subject TEXT,
  attempts INTEGER,
  stage_reached TEXT,
  interests TEXT[],
  skills TEXT[],
  priorities JSONB,
  resume_url TEXT,
  assessment_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Career Paths
CREATE TABLE public.career_paths (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  domain TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  overview TEXT,
  trajectory JSONB,
  salary_entry TEXT,
  salary_mid TEXT,
  salary_senior TEXT,
  perks TEXT[],
  impact TEXT,
  exposure TEXT,
  eligibility TEXT,
  skills_needed TEXT[],
  upsc_skill_mapping TEXT,
  difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
  growth_rate TEXT,
  courses JSONB,
  certifications TEXT[],
  portfolio_projects TEXT[],
  launchpad_weeks JSONB,
  estimated_cost TEXT,
  how_to_apply TEXT,
  youtube_links JSONB,
  podcast_links JSONB,
  linkedin_groups JSONB,
  professional_associations TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Career Matches
CREATE TABLE public.user_career_matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  career_path_id UUID REFERENCES public.career_paths(id) ON DELETE CASCADE,
  match_percentage INTEGER,
  is_pinned BOOLEAN DEFAULT FALSE,
  explored BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, career_path_id)
);

-- Stories
CREATE TABLE public.stories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  person_name TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  current_role TEXT,
  company TEXT,
  optional_subject TEXT,
  num_attempts INTEGER,
  career_path_id UUID REFERENCES public.career_paths(id),
  story_text TEXT,
  video_url TEXT,
  source_url TEXT,
  source_platform TEXT,
  photo_url TEXT,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mentors
CREATE TABLE public.mentors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  photo_url TEXT,
  current_role TEXT,
  company TEXT,
  career_path_id UUID REFERENCES public.career_paths(id),
  linkedin_url TEXT,
  specialities TEXT[],
  languages TEXT[],
  is_available BOOLEAN DEFAULT TRUE,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Therapists
CREATE TABLE public.therapists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  photo_url TEXT,
  specialization TEXT,
  location TEXT,
  online_available BOOLEAN DEFAULT TRUE,
  in_person_available BOOLEAN DEFAULT FALSE,
  languages TEXT[],
  booking_url TEXT,
  description TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum Posts
CREATE TABLE public.forum_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  display_name TEXT DEFAULT 'Anonymous',
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum Replies
CREATE TABLE public.forum_replies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  display_name TEXT DEFAULT 'Anonymous',
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Listings
CREATE TABLE public.job_listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  career_path_id UUID REFERENCES public.career_paths(id),
  company_name TEXT NOT NULL,
  company_logo_url TEXT,
  role_title TEXT NOT NULL,
  location TEXT,
  salary_range TEXT,
  experience_level TEXT,
  remote_available BOOLEAN DEFAULT FALSE,
  apply_url TEXT,
  is_aspirant_friendly BOOLEAN DEFAULT FALSE,
  description TEXT,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  source TEXT
);

-- Cohort Programs
CREATE TABLE public.cohort_programs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duration TEXT,
  start_date DATE,
  cohort_size INTEGER,
  topics TEXT[],
  status TEXT DEFAULT 'upcoming',
  apply_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment Conversations
CREATE TABLE public.assessment_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]'::jsonb,
  completed BOOLEAN DEFAULT FALSE,
  career_results JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved Jobs
CREATE TABLE public.saved_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_listing_id UUID REFERENCES public.job_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, job_listing_id)
);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_career_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Career paths: anyone can read
CREATE POLICY "Anyone can view career paths" ON public.career_paths FOR SELECT USING (true);

-- User career matches
CREATE POLICY "Users can view own matches" ON public.user_career_matches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own matches" ON public.user_career_matches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own matches" ON public.user_career_matches FOR UPDATE USING (auth.uid() = user_id);

-- Stories
CREATE POLICY "Anyone can view approved stories" ON public.stories FOR SELECT USING (is_approved = true);

-- Mentors
CREATE POLICY "Anyone can view mentors" ON public.mentors FOR SELECT USING (is_available = true);

-- Therapists
CREATE POLICY "Anyone can view therapists" ON public.therapists FOR SELECT USING (true);

-- Forum
CREATE POLICY "Authenticated can view posts" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated can create posts" ON public.forum_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated can view replies" ON public.forum_replies FOR SELECT USING (true);
CREATE POLICY "Authenticated can create replies" ON public.forum_replies FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Jobs
CREATE POLICY "Anyone can view jobs" ON public.job_listings FOR SELECT USING (true);

-- Cohorts
CREATE POLICY "Anyone can view cohorts" ON public.cohort_programs FOR SELECT USING (true);

-- Assessment conversations
CREATE POLICY "Users can view own assessments" ON public.assessment_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own assessments" ON public.assessment_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assessments" ON public.assessment_conversations FOR UPDATE USING (auth.uid() = user_id);

-- Saved jobs
CREATE POLICY "Users can view own saved jobs" ON public.saved_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save jobs" ON public.saved_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave jobs" ON public.saved_jobs FOR DELETE USING (auth.uid() = user_id);
