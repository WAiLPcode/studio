-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --- TABLES ---

-- 1. Users Table (Central User Information)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- Store hashed passwords, never plaintext
    role VARCHAR(50) NOT NULL CHECK (role IN ('job_seeker', 'employer')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster email lookup
CREATE INDEX idx_users_email ON users(email);

-- 2. Job Seeker Profiles Table (Additional Information)
CREATE TABLE job_seeker_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    headline TEXT, -- e.g., "Full Stack Developer"
    bio TEXT,
    phone_number VARCHAR(50),
    profile_picture_url TEXT, -- URL to a profile picture
    resume_url TEXT,          -- URL to a resume
    website_url TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Employer Profiles Table (Additional Information)
CREATE TABLE employer_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    contact_first_name VARCHAR(100) NOT NULL,
    contact_last_name VARCHAR(100) NOT NULL,
    company_website TEXT,
    company_description TEXT,
    company_logo_url TEXT,
    company_size VARCHAR(50),
    industry VARCHAR(100),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Skills Table (Centralized Skill List)
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    skill_name VARCHAR(100) UNIQUE NOT NULL
);

-- Index for faster skill lookup
CREATE INDEX idx_skills_name ON skills(skill_name);

-- 5. User Skills Table (Many-to-Many)
CREATE TABLE user_skills (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, skill_id)
);

-- Indexes for faster lookups
CREATE INDEX idx_user_skills_user ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill ON user_skills(skill_id);

-- 6. Job Postings Table
CREATE TABLE job_postings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_title VARCHAR(255) NOT NULL,
    job_description TEXT NOT NULL,
    location TEXT,
    employment_type VARCHAR(50) CHECK (employment_type IN ('Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary')),
    salary_min NUMERIC(12, 2),
    salary_max NUMERIC(12, 2),
    salary_currency VARCHAR(3) DEFAULT 'USD',
    experience_level VARCHAR(50),
    application_instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    posted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common query patterns
CREATE INDEX idx_job_postings_employer ON job_postings(employer_user_id);
CREATE INDEX idx_job_postings_location ON job_postings(location);
CREATE INDEX idx_job_postings_active_posted ON job_postings(is_active, posted_at DESC);

-- 7. Job Postings Skills Table (Many-to-Many)
CREATE TABLE job_posting_skills (
    job_posting_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (job_posting_id, skill_id)
);

-- Indexes for faster lookups
CREATE INDEX idx_job_posting_skills_job_posting ON job_posting_skills(job_posting_id);
CREATE INDEX idx_job_posting_skills_skill ON job_posting_skills(skill_id);

-- 8. Job Applications Table
CREATE TABLE job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    job_seeker_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Viewed', 'Interviewing', 'Offered', 'Rejected', 'Withdrawn')),
    cover_letter_text TEXT,
    resume_url_snapshot TEXT, -- URL of the resume at the time of application
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (job_posting_id, job_seeker_user_id)
);

-- Indexes for common query patterns
CREATE INDEX idx_job_applications_job ON job_applications(job_posting_id);
CREATE INDEX idx_job_applications_seeker ON job_applications(job_seeker_user_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);

-- --- Optional: Function to update `updated_at` timestamps automatically ---
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

CREATE TRIGGER set_timestamp_job_seeker_profiles
BEFORE UPDATE ON job_seeker_profiles
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

-- --- Row Level Security (RLS) ---

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_seeker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_posting_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Basic Policies

-- Users:
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (id = auth.uid());

-- Job Seeker Profiles:
CREATE POLICY "Job seekers can view their own profiles" ON job_seeker_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Job seekers can update their own profiles" ON job_seeker_profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Job seekers can insert their own profiles" ON job_seeker_profiles FOR INSERT WITH CHECK (auth.uid() = user_id AND (SELECT role FROM users WHERE id = auth.uid()) = 'job_seeker');

-- Employer Profiles:
CREATE POLICY "Employers can view their own profiles" ON employer_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Employers can update their own profiles" ON employer_profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Employers can insert their own profiles" ON employer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id AND (SELECT role FROM users WHERE id = auth.uid()) = 'employer');

-- Skills:
CREATE POLICY "Anyone can view skills" ON skills FOR SELECT USING (true);

-- User Skills:
CREATE POLICY "Users can view their own skills" ON user_skills FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own skills" ON user_skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own skills" ON user_skills FOR DELETE USING (user_id = auth.uid());

-- Job Postings:
CREATE POLICY "Anyone can view active job postings" ON job_postings FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Employers can insert job postings" ON job_postings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND (SELECT role FROM users WHERE id = auth.uid()) = 'employer');
CREATE POLICY "Employers can update their job postings" ON job_postings FOR UPDATE USING (auth.uid() = employer_user_id);
CREATE POLICY "Employers can delete their job postings" ON job_postings FOR DELETE USING (auth.uid() = employer_user_id);

-- Job Posting Skills:
CREATE POLICY "Employers can view job posting skills" ON job_posting_skills FOR SELECT USING (EXISTS (SELECT 1 FROM job_postings WHERE id = job_posting_id AND employer_user_id = auth.uid()));
CREATE POLICY "Employers can insert job posting skills" ON job_posting_skills FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM job_postings WHERE id = job_posting_id AND employer_user_id = auth.uid()));
CREATE POLICY "Employers can delete job posting skills" ON job_posting_skills FOR DELETE USING (EXISTS (SELECT 1 FROM job_postings WHERE id = job_posting_id AND employer_user_id = auth.uid()));

-- Job Applications:
CREATE POLICY "Job seekers can view their own applications" ON job_applications FOR SELECT USING (job_seeker_user_id = auth.uid());
CREATE POLICY "Job seekers can insert applications" ON job_applications FOR INSERT WITH CHECK (auth.uid() = job_seeker_user_id);
CREATE POLICY "Job seekers can update their applications" ON job_applications FOR UPDATE USING (job_seeker_user_id = auth.uid());
CREATE POLICY "Employers can view applications for their job postings" ON job_applications FOR SELECT USING (EXISTS (SELECT 1 FROM job_postings WHERE id = job_posting_id AND employer_user_id = auth.uid()));
CREATE POLICY "Employers can update applications for their job postings" ON job_applications FOR UPDATE USING (EXISTS (SELECT 1 FROM job_postings WHERE id = job_posting_id AND employer_user_id = auth.uid()));
