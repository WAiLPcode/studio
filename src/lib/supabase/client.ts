
import { createBrowserClient } from '@supabase/ssr';
import { type SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

if (typeof window !== 'undefined') {
  // Check if the global variable is already set.
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase URL or Anon Key are not set in the environment variables.');
      }
    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
}

export { supabaseClient };

export type {
  SupabaseClient
}

