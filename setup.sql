-- Supabase schema for JobFinder

-- Drop existing table if it exists (useful for resetting during development)
DROP TABLE IF EXISTS public.job_postings;

-- Create the job_postings table
CREATE TABLE public.job_postings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    title text NOT NULL,
    company_name text NOT NULL, -- Ensure this column name is correct
    location text NOT NULL,
    description text NOT NULL,
    application_instructions text NOT NULL,
    employment_type text, -- e.g., 'Full-time', 'Part-time'
    salary_min integer, -- Store salary as integer (e.g., cents or whole number)
    salary_max integer,
    salary_currency text DEFAULT 'USD'::text, -- e.g., 'USD', 'EUR'
    experience_level text, -- e.g., 'Entry-level', 'Mid-level'
    expires_at timestamp with time zone, -- Date when the posting expires
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT job_postings_pkey PRIMARY KEY (id),
    -- Add check constraint for salary range if desired
    CONSTRAINT salary_check CHECK ((salary_min IS NULL) OR (salary_max IS NULL) OR (salary_max >= salary_min))
);

-- Add comments to columns for better understanding
COMMENT ON COLUMN public.job_postings.id IS 'Primary key for the job posting';
COMMENT ON COLUMN public.job_postings.title IS 'Title of the job';
COMMENT ON COLUMN public.job_postings.company_name IS 'Name of the hiring company';
COMMENT ON COLUMN public.job_postings.location IS 'Location of the job (e.g., City, State or Remote)';
COMMENT ON COLUMN public.job_postings.description IS 'Detailed description of the job role and responsibilities';
COMMENT ON COLUMN public.job_postings.application_instructions IS 'Instructions on how to apply for the job';
COMMENT ON COLUMN public.job_postings.employment_type IS 'Type of employment (Full-time, Part-time, etc.)';
COMMENT ON COLUMN public.job_postings.salary_min IS 'Minimum salary offered (optional)';
COMMENT ON COLUMN public.job_postings.salary_max IS 'Maximum salary offered (optional)';
COMMENT ON COLUMN public.job_postings.salary_currency IS 'Currency for the salary (e.g., USD, EUR)';
COMMENT ON COLUMN public.job_postings.experience_level IS 'Required experience level (Entry-level, Mid-level, etc.)';
COMMENT ON COLUMN public.job_postings.expires_at IS 'Optional date when the job posting expires';
COMMENT ON COLUMN public.job_postings.created_at IS 'Timestamp when the job posting was created';
COMMENT ON COLUMN public.job_postings.updated_at IS 'Timestamp when the job posting was last updated';


-- Optional: Automatically update updated_at timestamp on row modification
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before update
DROP TRIGGER IF EXISTS on_job_postings_update ON public.job_postings;
CREATE TRIGGER on_job_postings_update
BEFORE UPDATE ON public.job_postings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();


-- Set up Row Level Security (RLS)
-- IMPORTANT: Adjust these policies based on your application's needs.
-- This example allows public read access and anonymous inserts.

-- 1. Enable RLS on the table
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- 2. Allow public read access to all rows
DROP POLICY IF EXISTS "Allow public read access" ON public.job_postings;
CREATE POLICY "Allow public read access" ON public.job_postings
    FOR SELECT USING (true);

-- 3. Allow anonymous users to insert new job postings
-- WARNING: This allows anyone to insert data. Add authentication if needed.
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.job_postings;
CREATE POLICY "Allow anonymous inserts" ON public.job_postings
    FOR INSERT WITH CHECK (true);

-- Optional: Policies for update and delete (usually restricted to authenticated users/roles)
-- Example: Allow authenticated users to update/delete their own posts (requires user_id column)
-- ALTER TABLE public.job_postings ADD COLUMN user_id uuid REFERENCES auth.users(id);
-- CREATE POLICY "Allow users to update own posts" ON public.job_postings
--     FOR UPDATE USING (auth.uid() = user_id);
-- CREATE POLICY "Allow users to delete own posts" ON public.job_postings
--     FOR DELETE USING (auth.uid() = user_id);


-- Optional: Add indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_job_postings_location ON public.job_postings USING btree (location);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON public.job_postings USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_expires_at ON public.job_postings USING btree (expires_at);


-- Grant usage permissions for the public schema to anon and authenticated roles
-- Grant select, insert, update, delete permissions for the job_postings table
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.job_postings TO anon, authenticated;

-- Grant execute permission for the handle_updated_at function if needed by specific roles
-- GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO anon, authenticated; -- Adjust roles as needed

-- Note: Supabase handles granting permissions on sequences automatically for default UUID generation.


-- Example Insert (for testing)
-- INSERT INTO public.job_postings (title, company_name, location, description, application_instructions, employment_type, experience_level)
-- VALUES ('Frontend Developer', 'Web Solutions Inc.', 'Remote', 'Develop amazing user interfaces.', 'Apply via our website link.', 'Full-time', 'Mid-level');

-- INSERT INTO public.job_postings (title, company_name, location, description, application_instructions, salary_min, salary_max, salary_currency, expires_at)
-- VALUES ('Backend Engineer', 'Data Systems Ltd.', 'New York, NY', 'Build robust backend services.', 'Email resume to hr@datasystems.com', 100000, 140000, 'USD', '2024-12-31');

