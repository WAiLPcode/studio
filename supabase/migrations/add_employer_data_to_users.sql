-- Migration to add company-related fields to the users table

-- Add company_name column
ALTER TABLE public.users
ADD COLUMN company_name TEXT;

-- Add company_website column
ALTER TABLE public.users
ADD COLUMN company_website TEXT;

-- Add industry column
ALTER TABLE public.users
ADD COLUMN industry TEXT;

-- Add company_description column
ALTER TABLE public.users
ADD COLUMN company_description TEXT;

-- Add company_logo_url column
ALTER TABLE public.users
ADD COLUMN company_logo_url TEXT;

-- Add company_size column
ALTER TABLE public.users
ADD COLUMN company_size TEXT;