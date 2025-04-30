
import { createBrowserClient } from '@supabase/ssr';
import { type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | undefined;

export function getSupabaseBrowserClient() {
  // Check if running in a browser environment before accessing process.env
  if (typeof window !== 'undefined') {
    if (client) {
      return client;
    }

    // Retrieve Supabase URL and Anon Key directly from process.env
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Validate that environment variables are set
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(
        'Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY). Check your .env.local file.'
      );
      // Optionally, throw an error or return null/undefined to indicate failure
      // throw new Error('Supabase environment variables are not set.');
      return undefined; // Return undefined if keys are missing
    }

    try {
      client = createBrowserClient(supabaseUrl, supabaseAnonKey);
      return client;
    } catch (error) {
      console.error('Error creating Supabase client:', error);
      // Optionally handle the error more gracefully
      return undefined; // Return undefined on creation error
    }
  }

  // If not in a browser environment, return undefined or handle accordingly
  // console.warn('getSupabaseBrowserClient called outside of browser environment.');
  return undefined;
}
