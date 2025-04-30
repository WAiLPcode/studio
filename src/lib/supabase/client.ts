
import { createBrowserClient } from '@supabase/ssr'
import { type SupabaseClient } from '@supabase/supabase-js'

// Use a function to ensure environment variables are accessed at runtime
function createSupabaseClient(): SupabaseClient | null {
    // Ensure this code runs only in the browser
    if (typeof window === 'undefined') {
        console.warn('Supabase client should only be initialized in the browser.');
        return null;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error(
          'Supabase URL or Anon Key is missing. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file.'
        );
        // Optionally return null or throw an error, depending on desired behavior
        return null; // Return null if credentials are missing
    }

    try {
        // Create and return the Supabase client instance
        return createBrowserClient(supabaseUrl, supabaseAnonKey);
    } catch (error) {
        console.error('Error creating Supabase client:', error);
        return null; // Return null on creation error
    }
}

// Singleton pattern: Ensure only one client instance is created
let clientInstance: SupabaseClient | null | undefined = undefined;

export function getSupabaseBrowserClient(): SupabaseClient | null {
    // If the instance hasn't been created yet, try to create it
    if (clientInstance === undefined) {
        clientInstance = createSupabaseClient();
    }
    // Return the existing instance (which might be null if creation failed)
    return clientInstance;
}
