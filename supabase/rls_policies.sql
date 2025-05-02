-- Enable Row Level Security (RLS) for all tables in the public schema

-- 1. Users Table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to select their own data
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT
    USING (id = auth.uid());

-- Create policy for users to update their own data
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE
    USING (id = auth.uid());

-- 2. User Profiles Table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to select their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT
    USING (user_id = auth.uid());

-- Create policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE
    USING (user_id = auth.uid());

-- Create policy for users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- 3. Employer Profiles Table
ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to select their own employer profile
CREATE POLICY "Users can view own employer profile" ON public.employer_profiles
    FOR SELECT
    USING (user_id = auth.uid());

-- Create policy for users to update their own employer profile
CREATE POLICY "Users can update own employer profile" ON public.employer_profiles
    FOR UPDATE
    USING (user_id = auth.uid());

-- Create policy for users to insert their own employer profile
CREATE POLICY "Users can insert own employer profile" ON public.employer_profiles
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- 4. Skills Table (publicly readable, but restricted writes)
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- Create policy for anyone to select skills
CREATE POLICY "Anyone can view skills" ON public.skills
    FOR SELECT
    USING (true);

-- Create policy for authenticated users to insert skills (could be restricted to admins in a real app)
CREATE POLICY "Authenticated users can insert skills" ON public.skills
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- 5. User Skills Table
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

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

-- Create policy for anyone to view active job postings
CREATE POLICY "Anyone can view active job postings" ON public.job_postings
    FOR SELECT
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

-- Create policy for job seekers to view their own applications
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

-- Create policy for job seekers to insert their own applications
CREATE POLICY "Job seekers can insert own applications" ON public.job_applications
    FOR INSERT
    WITH CHECK (job_seeker_user_id = auth.uid());

-- Create policy for job seekers to update their own applications (e.g., withdraw)
CREATE POLICY "Job seekers can update own applications" ON public.job_applications
    FOR UPDATE
    USING (job_seeker_user_id = auth.uid());

-- Create policy for employers to update applications for their job postings (e.g., change status)
CREATE POLICY "Employers can update applications for their jobs" ON public.job_applications
    FOR UPDATE
    USING (
        job_posting_id IN (
            SELECT id FROM public.job_postings 
            WHERE employer_user_id = auth.uid()
        )
    );