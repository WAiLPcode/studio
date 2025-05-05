
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
    // Create the Supabase client with explicit headers to include the apikey
    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      },
      // Ensure auth is properly configured for RLS policies
      auth: {
        autoRefreshToken: true,
        persistSession: true
      }
    });
  }
}

export { supabaseClient };

export type {
  SupabaseClient
}

