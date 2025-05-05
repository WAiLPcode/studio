-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --- TABLES ---

-- 1. Users Table: Stores basic login information and role.
-- Potentially links to Supabase Auth users via the id.
CREATE TABLE users (
    id UUID PRIMARY KEY, -- Primary Key, references supabase.auth.users.id
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('job_seeker', 'employer')), -- User role
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster email lookup
CREATE INDEX idx_users_email ON users(email);

-- 2. User Profiles Table: Stores additional information about any user.
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, -- Foreign Key linking to users table (one-to-one)
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(50),
    headline TEXT, -- e.g., "Full Stack Developer | React, Node.js"
    bio TEXT,      -- Longer user description/summary
    profile_picture_url TEXT, -- URL to profile picture (e.g., stored in Supabase Storage)
    resume_url TEXT,          -- URL to resume file (e.g., stored in Supabase Storage)
    website_url TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Employer Profiles Table: Stores information specific to employers.
CREATE TABLE employer_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, -- Foreign Key linking to users table (one-to-one)
    company_name VARCHAR(255) NOT NULL,
    company_website TEXT,
    company_description TEXT,
    company_logo_url TEXT, -- URL to company logo (e.g., stored in Supabase Storage)
    company_size VARCHAR(50), -- e.g., "1-10", "11-50", "50+"
    industry VARCHAR(100),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Ensure only users with 'employer' role can have an employer profile
-- (This might be better enforced at the application level or via triggers/policies in Supabase)


-- 4. Skills Table: Stores a list of predefined skills.
CREATE TABLE skills (
    id SERIAL PRIMARY KEY, -- Simple auto-incrementing ID for skills
    skill_name VARCHAR(100) UNIQUE NOT NULL
);

-- Index for faster skill lookup
CREATE INDEX idx_skills_name ON skills(skill_name);

-- 5. User Skills Table: Join table linking users (job seekers) to skills (many-to-many).
CREATE TABLE user_skills (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, skill_id) -- Composite primary key
);

-- Index for faster lookups
CREATE INDEX idx_user_skills_user ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill ON user_skills(skill_id);


-- 6. Job Postings Table: Stores details about job openings posted by employers.
CREATE TABLE job_postings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Link to the employer user who posted (nullable for development)
    job_title VARCHAR(255) NOT NULL,
    job_description TEXT NOT NULL,
    location TEXT, -- Can be specific city/country or "Remote"
    employment_type VARCHAR(50) CHECK (employment_type IN ('Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary')), -- e.g., Full-time, Part-time
    salary_min NUMERIC(12, 2), -- Optional minimum salary
    salary_max NUMERIC(12, 2), -- Optional maximum salary
    salary_currency VARCHAR(3) DEFAULT 'USD', -- e.g., USD, EUR
    experience_level VARCHAR(50), -- e.g., Entry-level, Mid-level, Senior-level
    required_skills TEXT, -- Could be a comma-separated string or link to skills table if more structured search is needed
    application_instructions TEXT, -- How to apply (e.g., link, email)
    is_active BOOLEAN DEFAULT TRUE, -- To easily activate/deactivate postings
    posted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ, -- Optional expiration date
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common query patterns
CREATE INDEX idx_job_postings_employer ON job_postings(employer_user_id);
CREATE INDEX idx_job_postings_location ON job_postings(location);
CREATE INDEX idx_job_postings_active_posted ON job_postings(is_active, posted_at DESC);


-- 7. Job Applications Table: Tracks applications submitted by job seekers for jobs.
CREATE TABLE job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    job_seeker_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Viewed', 'Interviewing', 'Offered', 'Rejected', 'Withdrawn')), -- Application status
    cover_letter_text TEXT, -- Optional cover letter directly in DB
    resume_url_snapshot TEXT, -- Optional: URL of the resume *at the time of application*
    UNIQUE (job_posting_id, job_seeker_user_id), -- Ensure a user applies only once per job
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common query patterns
CREATE INDEX idx_job_applications_job ON job_applications(job_posting_id);
CREATE INDEX idx_job_applications_seeker ON job_applications(job_seeker_user_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);


-- --- Optional: Function to update `updated_at` timestamps automatically ---
-- (Common practice in PostgreSQL)
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';


-- Apply the trigger function to tables with `updated_at`
CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_user_profiles
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_employer_profiles
BEFORE UPDATE ON employer_profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_job_postings
BEFORE UPDATE ON job_postings
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_job_applications
BEFORE UPDATE ON job_applications
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Enable Row Level Security (RLS) for all tables
-- For detailed policies, see rls_policies.sql

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Basic policies for each table (more detailed policies in rls_policies.sql)
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can view own employer profile" ON public.employer_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Anyone can view skills" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Users can view own skills" ON public.user_skills FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Anyone can view active job postings" ON public.job_postings FOR SELECT USING (is_active = true);
CREATE POLICY "Job seekers can view own applications" ON public.job_applications FOR SELECT USING (job_seeker_user_id = auth.uid());