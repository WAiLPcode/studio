import { createBrowserClient } from '@supabase/ssr';
import { type SupabaseClient } from '@supabase/supabase-js';

interface CustomGlobal extends Global {
  supabaseClient?: SupabaseClient;
}

if (typeof window !== 'undefined') {
  // Check if the global variable is already set.
  if (!(globalThis as CustomGlobal).supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Supabase URL or Anon Key are not set in the environment variables.'
      );
    }
    (globalThis as CustomGlobal).supabaseClient = createBrowserClient(
      supabaseUrl,
      supabaseAnonKey
    );
  }
}


export const supabaseClient: SupabaseClient | null =
  (globalThis as CustomGlobal).supabaseClient || null;

export type { SupabaseClient };

