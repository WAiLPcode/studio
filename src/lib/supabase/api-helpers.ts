/**
 * Helper functions for making authenticated API requests to Supabase
 */

/**
 * Creates headers with the necessary authentication for Supabase API requests
 * @returns Headers object with apikey and other required headers
 */
export function createSupabaseHeaders(): Headers {
  const headers = new Headers();
  
  // Add the apikey header which is required for all Supabase API requests
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseAnonKey) {
    headers.set('apikey', supabaseAnonKey);
  } else {
    console.error('Supabase Anon Key is not set in environment variables');
  }
  
  // Set content type for JSON requests
  headers.set('Content-Type', 'application/json');
  
  // Add authorization header if user is logged in
  // Note: For proper RLS policy enforcement, we should use a JWT token
  // In this implementation, we're using the anon key for public access
  // This ensures the 'Anyone can insert into users' policy works correctly
  
  // We're intentionally NOT setting an Authorization header for anonymous operations
  // like user registration, which should be allowed by the RLS policy
  
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('jobfinder_user') : null;
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      if (user && user.id) {
        // For authenticated operations, we would ideally use a JWT token
        // For now, we'll continue using the user ID, but this should be replaced with a proper JWT
        headers.set('Authorization', `Bearer ${user.id}`);
      }
    } catch (error) {
      console.error('Error parsing stored user data:', error);
    }
  }
  
  return headers;
}

/**
 * Makes an authenticated fetch request to Supabase
 * @param url The Supabase endpoint URL
 * @param options Fetch options
 * @returns Promise with the fetch response
 */
export async function fetchWithSupabaseAuth(url: string, options: RequestInit = {}): Promise<Response> {
  // Create headers with authentication
  const headers = createSupabaseHeaders();
  
  // Merge with any headers provided in options
  const mergedHeaders = new Headers(options.headers);
  for (const [key, value] of headers.entries()) {
    if (!mergedHeaders.has(key)) {
      mergedHeaders.set(key, value);
    }
  }
  
  // Make the authenticated request
  return fetch(url, {
    ...options,
    headers: mergedHeaders
  });
}