export type Database = {
  public: {
    Tables: {
      employer_profiles: {
        Row: {
          company_description: string | null
          company_logo_url: string | null
          company_name: string | null
          company_size: string | null
          company_website: string | null
          email: string | null
          id: number
          industry: string | null
          user_id: string
        }
        Insert: {
          company_description?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_size?: string | null
          company_website?: string | null
          email?: string | null
          id?: number
          industry?: string | null
          user_id: string
        }
        Update: {
          company_description?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_size?: string | null
          company_website?: string | null
          email?: string | null
          id?: number
          industry?: string | null
          user_id?: string
        }
      }
      job_seeker_profiles: {
        Row: {
          bio: string | null
          first_name: string | null
          headline: string | null
          id: number
          last_name: string | null
          user_id: string
        }
        Insert: {
          bio?: string | null
          first_name?: string | null
          headline?: string | null
          id?: number
          last_name?: string | null
          user_id: string
        }
        Update: {
          bio?: string | null
          first_name?: string | null
          headline?: string | null
          id?: number
          last_name?: string | null
          user_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}