export type { Database } from "./supabase";

  
export interface JobPosting {
  id: string;
  employer_user_id: string; // Reference to the employer user
  job_title: string; // Changed from title to match DB schema
  job_description: string; // Changed from description to match DB schema
  location: string;
  application_instructions: string;
  employment_type?: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Temporary';
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string;
  experience_level?: string;
  is_active?: boolean; // Added from DB schema
  expires_at?: string | null; // ISO date string or null
  posted_at?: string; // Added from DB schema (renamed from created_at)
  updated_at?: string;
  // These fields come from joined employer_profiles and aren't in job_postings table
  company_name?: string; // This comes from employer_profiles, not job_postings
  company_website?: string; // This comes from employer_profiles, not job_postings
}

export interface JobPostingWithEmployerProfile extends JobPosting {
  company_name: string;
  company_website: string;
  company_logo_url?: string;
  industry?: string;
  company_description?: string;
}

