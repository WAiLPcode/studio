export type { Database } from "./supabase";

  
export interface JobPosting {
  company_website: any;
  id: string;
  title: string;
  company_name: string;
  location: string;
  description: string;
  application_instructions: string;
  employment_type?: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Temporary'; // Made optional if not always present
  salary_min?: number | null; // Can be number or null
  salary_max?: number | null; // Can be number or null
  salary_currency?: 'USD' | 'EUR'; // Made optional if not always present
  experience_level?: 'Entry-level' | 'Mid-level' | 'Senior-level'; // Made optional if not always present
  expires_at?: string | null; // ISO date string or null
  created_at: string; // Assuming this is always present
  updated_at?: string; // Added updated_at as it's used in ordering
}

export interface JobPostingWithEmployerProfile extends JobPosting {
  company_name: string;
  company_website: string;
}

