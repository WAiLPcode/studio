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

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE
    USING (id = auth.uid());

-- Create policy for anyone to insert users
DROP POLICY IF EXISTS "Anyone can insert users" ON public.users;
DROP POLICY IF EXISTS "Anyone can insert into users" ON public.users;
DROP POLICY IF EXISTS "Public insert access for users" ON public.users;

-- Create policy for authenticated users to insert their own user record
CREATE POLICY "Auth users can insert their own user record" ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Temporarily disable RLS for the users table to allow registration
-- Comment this out after debugging is complete
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Disable RLS temporarily for debugging if needed
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;


-- 2. User Profiles Table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Create policy for users to select their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT
    USING (user_id = auth.uid());


-- Create policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE
    USING (user_id = auth.uid());

-- Create policy for users to insert their own profile

-- Allow users to insert their own profile when authenticated
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to insert their own profile during registration
DROP POLICY IF EXISTS "Public insert access for user profiles" ON public.user_profiles;
CREATE POLICY "Auth users can insert their own profile" ON public.user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Disable RLS temporarily for debugging if needed
-- ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 3. Employer Profiles Table
ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own employer profile" ON public.employer_profiles;
DROP POLICY IF EXISTS "Users can update own employer profile" ON public.employer_profiles;
DROP POLICY IF EXISTS "Users can insert own employer profile" ON public.employer_profiles;

-- Create policy for users to select their own employer profile
CREATE POLICY "Users can view own employer profile" ON public.employer_profiles
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update own employer profile" ON public.employer_profiles
    FOR UPDATE
    USING (user_id = auth.uid());

-- Allow users to insert their own employer profile when authenticated
CREATE POLICY "Users can insert own employer profile" ON public.employer_profiles
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to insert their own employer profile during registration
DROP POLICY IF EXISTS "Public insert access for employer profiles" ON public.employer_profiles;
CREATE POLICY "Auth users can insert their own employer profile" ON public.employer_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Disable RLS temporarily for debugging if needed
-- ALTER TABLE public.employer_profiles DISABLE ROW LEVEL SECURITY;

-- 4. Skills Table (publicly readable, but restricted writes)
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

-- 5. User Skills Table
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

-- 6. Job Postings Table
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Employers can view own job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Employers can insert own job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Employers can update own job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Employers can delete own job postings" ON public.job_postings;
-- Create policy for anyone to view active job postings
CREATE POLICY "Anyone can view active job postings" ON public.job_postings
    USING (is_active = true);

-- Create policy for employers to view all their own job postings (active or inactive)
CREATE POLICY "Employers can view own job postings" ON public.job_postings
    FOR SELECT
    USING (employer_user_id = auth.uid());

-- Create policy for employers to insert their own job postings
CREATE POLICY "Employers can insert own job postings" ON public.job_postings
    FOR INSERT
    WITH CHECK (employer_user_id = auth.uid());

-- Create policy for employers to update their own job postings
CREATE POLICY "Employers can update own job postings" ON public.job_postings
    FOR UPDATE
    USING (employer_user_id = auth.uid());

-- Create policy for employers to delete their own job postings
CREATE POLICY "Employers can delete own job postings" ON public.job_postings
    FOR DELETE
    USING (employer_user_id = auth.uid());

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
