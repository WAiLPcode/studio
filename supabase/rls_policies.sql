-- Enable Row Level Security (RLS) for all tables in the public schema

-- 1. Users Table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Anyone can insert users" ON public.users;

-- Create policy for users to select their own data
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT
    USING (id = auth.uid());

-- Create policy for users to update their own data
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE
    USING (id = auth.uid());

-- Create policy for inserting new users
CREATE POLICY "Anyone can insert users" ON public.users
    FOR INSERT
    WITH CHECK (true);

-- 2. Job Seeker Profiles Table
ALTER TABLE public.job_seeker_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own job seeker profile" ON public.job_seeker_profiles;
DROP POLICY IF EXISTS "Users can update own job seeker profile" ON public.job_seeker_profiles;
DROP POLICY IF EXISTS "Users can insert own job seeker profile" ON public.job_seeker_profiles;

-- Create policy for users to select their own profile
CREATE POLICY "Users can view own job seeker profile" ON public.job_seeker_profiles
    FOR SELECT
    USING (user_id = auth.uid());

-- Create policy for users to update their own profile
CREATE POLICY "Users can update own job seeker profile" ON public.job_seeker_profiles
    FOR UPDATE
    USING (user_id = auth.uid());

-- Create policy for users to insert their own profile
CREATE POLICY "Users can insert own job seeker profile" ON public.job_seeker_profiles
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- 3. Employer Profiles Table
ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own employer profile" ON public.employer_profiles;
DROP POLICY IF EXISTS "Users can update own employer profile" ON public.employer_profiles;
DROP POLICY IF EXISTS "Users can insert own employer profile" ON public.employer_profiles;

-- Create policy for users to select their own profile
CREATE POLICY "Users can view own employer profile" ON public.employer_profiles
    FOR SELECT
    USING (user_id = auth.uid());

-- Create policy for users to update their own profile
CREATE POLICY "Users can update own employer profile" ON public.employer_profiles
    FOR UPDATE
    USING (user_id = auth.uid());

-- Create policy for users to insert their own profile
CREATE POLICY "Users can insert own employer profile" ON public.employer_profiles
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- 4. Job Postings Table
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Employers can insert job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Employers can update their job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Employers can delete their job postings" ON public.job_postings;

-- Create policy for viewing active job postings
CREATE POLICY "Anyone can view active job postings" ON public.job_postings
    FOR SELECT
    USING (is_active = true);

-- Create policy for employers to insert job postings
CREATE POLICY "Employers can insert job postings" ON public.job_postings
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'employer'
        )
    );

-- Create policy for employers to update their job postings
CREATE POLICY "Employers can update their job postings" ON public.job_postings
    FOR UPDATE
    USING (
        auth.uid() = employer_user_id AND
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'employer'
        )
    );

-- Create policy for employers to delete their job postings
CREATE POLICY "Employers can delete their job postings" ON public.job_postings
    FOR DELETE
    USING (
        auth.uid() = employer_user_id AND
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'employer'
        )
    );

-- 5. Skills Table (publicly readable, but restricted writes)
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view skills" ON public.skills;
DROP POLICY IF EXISTS "Authenticated users can insert skills" ON public.skills;

-- Create policy for anyone to select skills
CREATE POLICY "Anyone can view skills" ON public.skills
    FOR SELECT
    USING (true);


CREATE POLICY "Authenticated users can insert skills" ON public.skills
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- 6. User Skills Table
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can delete own skills" ON public.user_skills;
DROP POLICY IF EXISTS "Users can view own skills" ON public.user_skills;
DROP POLICY IF EXISTS "Users can insert own skills" ON public.user_skills;
DROP POLICY IF EXISTS "Users can delete own skills" ON public.user_skills;
-- Create policy for users to select their own skills

CREATE POLICY "Users can view own skills" ON public.user_skills
    FOR SELECT
    USING (user_id = auth.uid());

-- Create policy for users to insert their own skills
CREATE POLICY "Users can insert own skills" ON public.user_skills
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Create policy for users to delete their own skills
CREATE POLICY "Users can delete own skills" ON public.user_skills
    FOR DELETE
    USING (user_id = auth.uid());

-- 7. Job Applications Table
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Job seekers can view own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON public.job_applications;
DROP POLICY IF EXISTS "Job seekers can insert own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Employers can update applications for their jobs" ON public.job_applications;
DROP POLICY IF EXISTS "Job seekers can update own applications" ON public.job_applications;

CREATE POLICY "Job seekers can view own applications" ON public.job_applications
    FOR SELECT 
    USING (job_seeker_user_id = auth.uid());

-- Create policy for employers to view applications for their job postings
CREATE POLICY "Employers can view applications for their jobs" ON public.job_applications
    FOR SELECT
    USING (
        job_posting_id IN (
            SELECT id FROM public.job_postings 
            WHERE employer_user_id = auth.uid()
        )
    );

CREATE POLICY "Job seekers can insert own applications" ON public.job_applications
    FOR INSERT
    WITH CHECK (job_seeker_user_id = auth.uid());

-- Create policy for job seekers to update their own applications (e.g., withdraw)
CREATE POLICY "Job seekers can update own applications" ON public.job_applications FOR UPDATE
    USING (job_seeker_user_id = auth.uid());

-- Create policy for employers to update applications for their job postings (e.g., change status)
CREATE POLICY "Employers can update applications for their jobs" ON public.job_applications FOR UPDATE
    USING (
        job_posting_id IN (
            SELECT id FROM public.job_postings 
            WHERE employer_user_id = auth.uid()
        )
    );