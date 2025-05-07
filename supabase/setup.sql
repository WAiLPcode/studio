-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --- TABLES ---

-- 1. Users Table (Central User Information)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- Store hashed passwords, never plaintext
    role VARCHAR(50) NOT NULL CHECK (role IN ('job_seeker', 'employer')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name TEXT,
    company_website TEXT,
    industry TEXT,
    company_description TEXT,
    company_logo_url TEXT,
    company_size TEXT,
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
CREATE INDEX idx_job_postings_job_title ON job_postings(job_title);

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

-- --- Functions for Profile Management ---

-- Function to update job seeker profile
CREATE OR REPLACE FUNCTION update_job_seeker_profile(
    p_user_id UUID,
    p_first_name VARCHAR(100),
    p_last_name VARCHAR(100),
    p_headline TEXT DEFAULT NULL,
    p_bio TEXT DEFAULT NULL,
    p_phone_number VARCHAR(50) DEFAULT NULL,
    p_profile_picture_url TEXT DEFAULT NULL,
    p_resume_url TEXT DEFAULT NULL,
    p_website_url TEXT DEFAULT NULL,
    p_linkedin_url TEXT DEFAULT NULL,
    p_github_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR(50);
BEGIN
    -- Check if the user exists and is a job seeker
    SELECT role INTO v_role FROM users WHERE id = p_user_id;
    
    IF v_role IS NULL THEN
        RAISE EXCEPTION 'User not found';
        RETURN FALSE;
    END IF;
    
    IF v_role != 'job_seeker' THEN
        RAISE EXCEPTION 'User is not a job seeker';
        RETURN FALSE;
    END IF;
    
    -- Update the job seeker profile
    UPDATE job_seeker_profiles
    SET 
        first_name = COALESCE(p_first_name, first_name),
        last_name = COALESCE(p_last_name, last_name),
        headline = COALESCE(p_headline, headline),
        bio = COALESCE(p_bio, bio),
        phone_number = COALESCE(p_phone_number, phone_number),
        profile_picture_url = COALESCE(p_profile_picture_url, profile_picture_url),
        resume_url = COALESCE(p_resume_url, resume_url),
        website_url = COALESCE(p_website_url, website_url),
        linkedin_url = COALESCE(p_linkedin_url, linkedin_url),
        github_url = COALESCE(p_github_url, github_url)
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        -- If no profile exists, create one
        INSERT INTO job_seeker_profiles (
            user_id, first_name, last_name, headline, bio, phone_number,
            profile_picture_url, resume_url, website_url, linkedin_url, github_url
        ) VALUES (
            p_user_id, p_first_name, p_last_name, p_headline, p_bio, p_phone_number,
            p_profile_picture_url, p_resume_url, p_website_url, p_linkedin_url, p_github_url
        );
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Function to update employer profile
CREATE OR REPLACE FUNCTION update_employer_profile(
    p_user_id UUID,
    p_company_name VARCHAR(255),
    p_contact_first_name VARCHAR(100),
    p_contact_last_name VARCHAR(100),
    p_company_website TEXT DEFAULT NULL,
    p_company_description TEXT DEFAULT NULL,
    p_company_logo_url TEXT DEFAULT NULL,
    p_company_size VARCHAR(50) DEFAULT NULL,
    p_industry VARCHAR(100) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR(50);
BEGIN
    -- Check if the user exists and is an employer
    SELECT role INTO v_role FROM users WHERE id = p_user_id;
    
    IF v_role IS NULL THEN
        RAISE EXCEPTION 'User not found';
        RETURN FALSE;
    END IF;
    
    IF v_role != 'employer' THEN
        RAISE EXCEPTION 'User is not an employer';
        RETURN FALSE;
    END IF;
    
    -- Update the employer profile
    UPDATE employer_profiles
    SET 
        company_name = COALESCE(p_company_name, company_name),
        contact_first_name = COALESCE(p_contact_first_name, contact_first_name),
        contact_last_name = COALESCE(p_contact_last_name, contact_last_name),
        company_website = COALESCE(p_company_website, company_website),
        company_description = COALESCE(p_company_description, company_description),
        company_logo_url = COALESCE(p_company_logo_url, company_logo_url),
        company_size = COALESCE(p_company_size, company_size),
        industry = COALESCE(p_industry, industry)
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        -- If no profile exists, create one
        INSERT INTO employer_profiles (
            user_id, company_name, contact_first_name, contact_last_name,
            company_website, company_description, company_logo_url, company_size, industry
        ) VALUES (
            p_user_id, p_company_name, p_contact_first_name, p_contact_last_name,
            p_company_website, p_company_description, p_company_logo_url, p_company_size, p_industry
        );
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Function to search jobs by title
CREATE OR REPLACE FUNCTION search_jobs_by_title(search_term TEXT)
RETURNS TABLE (
    id UUID,
    employer_user_id UUID,
    job_title VARCHAR(255),
    job_description TEXT,
    location TEXT,
    employment_type VARCHAR(50),
    salary_min NUMERIC(12, 2),
    salary_max NUMERIC(12, 2),
    salary_currency VARCHAR(3),
    experience_level VARCHAR(50),
    posted_at TIMESTAMPTZ,
    company_name VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        jp.id,
        jp.employer_user_id,
        jp.job_title,
        jp.job_description,
        jp.location,
        jp.employment_type,
        jp.salary_min,
        jp.salary_max,
        jp.salary_currency,
        jp.experience_level,
        jp.posted_at,
        ep.company_name
    FROM 
        job_postings jp
    JOIN 
        employer_profiles ep ON jp.employer_user_id = ep.user_id
    WHERE 
        jp.is_active = TRUE AND
        jp.job_title ILIKE '%' || search_term || '%'
    ORDER BY 
        jp.posted_at DESC;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

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

-- --- Function Permissions ---

-- Grant permissions to use the profile update functions
GRANT EXECUTE ON FUNCTION update_job_seeker_profile TO authenticated;
GRANT EXECUTE ON FUNCTION update_employer_profile TO authenticated;
GRANT EXECUTE ON FUNCTION search_jobs_by_title TO authenticated, anon;

-- Create secure wrapper functions that enforce user permissions
CREATE OR REPLACE FUNCTION update_my_job_seeker_profile(
    p_first_name VARCHAR(100),
    p_last_name VARCHAR(100),
    p_headline TEXT DEFAULT NULL,
    p_bio TEXT DEFAULT NULL,
    p_phone_number VARCHAR(50) DEFAULT NULL,
    p_profile_picture_url TEXT DEFAULT NULL,
    p_resume_url TEXT DEFAULT NULL,
    p_website_url TEXT DEFAULT NULL,
    p_linkedin_url TEXT DEFAULT NULL,
    p_github_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Only allow users to update their own profile
    RETURN update_job_seeker_profile(
        auth.uid(),
        p_first_name,
        p_last_name,
        p_headline,
        p_bio,
        p_phone_number,
        p_profile_picture_url,
        p_resume_url,
        p_website_url,
        p_linkedin_url,
        p_github_url
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION update_my_employer_profile(
    p_company_name VARCHAR(255),
    p_contact_first_name VARCHAR(100),
    p_contact_last_name VARCHAR(100),
    p_company_website TEXT DEFAULT NULL,
    p_company_description TEXT DEFAULT NULL,
    p_company_logo_url TEXT DEFAULT NULL,
    p_company_size VARCHAR(50) DEFAULT NULL,
    p_industry VARCHAR(100) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Only allow users to update their own profile
    RETURN update_employer_profile(
        auth.uid(),
        p_company_name,
        p_contact_first_name,
        p_contact_last_name,
        p_company_website,
        p_company_description,
        p_company_logo_url,
        p_company_size,
        p_industry
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Grant permissions to use the secure wrapper functions
GRANT EXECUTE ON FUNCTION update_my_job_seeker_profile TO authenticated;
GRANT EXECUTE ON FUNCTION update_my_employer_profile TO authenticated;

-- --- Data Synchronization Functions ---

-- Function to synchronize user data to employer profiles
CREATE OR REPLACE FUNCTION sync_user_data_to_employer_profiles()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process employer users
  IF NEW.role = 'employer' THEN
    -- Check if a corresponding record exists in employer_profiles
    IF EXISTS (SELECT 1 FROM public.employer_profiles WHERE user_id = NEW.id) THEN
      -- Update the record in employer_profiles
      UPDATE public.employer_profiles
      SET
        company_name = COALESCE(NEW.company_name, company_name),
        company_website = COALESCE(NEW.company_website, company_website),
        industry = COALESCE(NEW.industry, industry),
        company_description = COALESCE(NEW.company_description, company_description),
        company_logo_url = COALESCE(NEW.company_logo_url, company_logo_url),
        company_size = COALESCE(NEW.company_size, company_size)
      WHERE user_id = NEW.id;
    ELSE
      -- Insert a new row into employer_profiles if company_name is provided
      IF NEW.company_name IS NOT NULL THEN
        INSERT INTO public.employer_profiles (
          user_id,
          company_name,
          contact_first_name,
          contact_last_name,
          company_website,
          company_description,
          company_logo_url,
          company_size,
          industry
        )
        VALUES (
          NEW.id,
          NEW.company_name,
          COALESCE(NEW.first_name, 'Contact'),
          COALESCE(NEW.last_name, 'Person'),
          NEW.company_website,
          NEW.company_description,
          NEW.company_logo_url,
          NEW.company_size,
          NEW.industry
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create a trigger that fires after an insert or update on the users table for employers
CREATE TRIGGER on_employer_change
AFTER INSERT OR UPDATE ON users
FOR EACH ROW
WHEN (NEW.role = 'employer')
EXECUTE FUNCTION sync_user_data_to_employer_profiles();

-- Function to search jobs by multiple criteria including job title
CREATE OR REPLACE FUNCTION search_jobs(
  p_job_title TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_employment_type TEXT DEFAULT NULL,
  p_min_salary NUMERIC DEFAULT NULL,
  p_skills INTEGER[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  employer_user_id UUID,
  job_title VARCHAR(255),
  job_description TEXT,
  location TEXT,
  employment_type VARCHAR(50),
  salary_min NUMERIC(12, 2),
  salary_max NUMERIC(12, 2),
  salary_currency VARCHAR(3),
  experience_level VARCHAR(50),
  posted_at TIMESTAMPTZ,
  company_name VARCHAR(255),
  skills TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jp.id,
    jp.employer_user_id,
    jp.job_title,
    jp.job_description,
    jp.location,
    jp.employment_type,
    jp.salary_min,
    jp.salary_max,
    jp.salary_currency,
    jp.experience_level,
    jp.posted_at,
    ep.company_name,
    ARRAY_AGG(s.skill_name) AS skills
  FROM 
    job_postings jp
  JOIN 
    employer_profiles ep ON jp.employer_user_id = ep.user_id
  LEFT JOIN
    job_posting_skills jps ON jp.id = jps.job_posting_id
  LEFT JOIN
    skills s ON jps.skill_id = s.id
  WHERE 
    jp.is_active = TRUE
    AND (p_job_title IS NULL OR jp.job_title ILIKE '%' || p_job_title || '%')
    AND (p_location IS NULL OR jp.location ILIKE '%' || p_location || '%')
    AND (p_employment_type IS NULL OR jp.employment_type = p_employment_type)
    AND (p_min_salary IS NULL OR jp.salary_min >= p_min_salary)
    AND (p_skills IS NULL OR EXISTS (
      SELECT 1 FROM job_posting_skills jps2
      WHERE jps2.job_posting_id = jp.id AND jps2.skill_id = ANY(p_skills)
    ))
  GROUP BY
    jp.id, jp.employer_user_id, jp.job_title, jp.job_description, jp.location,
    jp.employment_type, jp.salary_min, jp.salary_max, jp.salary_currency,
    jp.experience_level, jp.posted_at, ep.company_name
  ORDER BY 
    jp.posted_at DESC;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Grant permission to use the search function
GRANT EXECUTE ON FUNCTION search_jobs TO authenticated, anon;

-- Function to synchronize user data to job seeker profiles
CREATE OR REPLACE FUNCTION sync_user_data_to_job_seeker_profiles()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process job seeker users
  IF NEW.role = 'job_seeker' THEN
    -- Check if a corresponding record exists in job_seeker_profiles
    IF EXISTS (SELECT 1 FROM public.job_seeker_profiles WHERE user_id = NEW.id) THEN
      -- Update the record in job_seeker_profiles
      UPDATE public.job_seeker_profiles
      SET
        first_name = COALESCE(NEW.first_name, first_name),
        last_name = COALESCE(NEW.last_name, last_name)
      WHERE user_id = NEW.id;
    ELSE
      -- Insert a new row into job_seeker_profiles if first_name and last_name are provided
      IF NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN
        INSERT INTO public.job_seeker_profiles (
          user_id,
          first_name,
          last_name
        )
        VALUES (
          NEW.id,
          NEW.first_name,
          NEW.last_name
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create a trigger that fires after an insert or update on the users table for job seekers
CREATE TRIGGER on_job_seeker_change
AFTER INSERT OR UPDATE ON users
FOR EACH ROW
WHEN (NEW.role = 'job_seeker')
EXECUTE FUNCTION sync_user_data_to_job_seeker_profiles();
