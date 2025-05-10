import { createBrowserClient } from '@supabase/ssr';
import { type SupabaseClient } from '@supabase/supabase-js';

interface CustomGlobal extends Global {
  supabaseClient?: SupabaseClient;
}

let supabaseClientInstance: SupabaseClient | null = null;

const initializeSupabaseClient = () => {
  if (typeof window === 'undefined') {
    return null; // Return null on the server side
  }
  
  if (supabaseClientInstance) {
    return supabaseClientInstance; // Return cached instance
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    return null;
  }

  try {
    supabaseClientInstance = createBrowserClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return document.cookie
              .split('; ')
              .find(row => row.startsWith(`${name}=`))
              ?.split('=')[1];
          },
          set(name: string, value: string, options: { path?: string; maxAge?: number; domain?: string; }) {
            let cookie = `${name}=${value}`;
            if (options.path) cookie += `; path=${options.path}`;
            if (options.maxAge) cookie += `; max-age=${options.maxAge}`;
            if (options.domain) cookie += `; domain=${options.domain}`;
            document.cookie = cookie;
          },
          remove(name: string, options: { path?: string; }) {
            let cookie = `${name}=; max-age=0`;
            if (options.path) cookie += `; path=${options.path}`;
            document.cookie = cookie;
          },
        },
      }
    );
    
    console.log('Supabase client initialized successfully');
    return supabaseClientInstance;
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    return null;
  }
};

export const supabaseClient = initializeSupabaseClient();
export type { SupabaseClient };

