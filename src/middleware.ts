import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware runs on every request
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;

  // Only apply this middleware to API requests to Supabase
  if (pathname.includes('supabase.co')) {
    // Clone the request headers
    const requestHeaders = new Headers(request.headers);
    
    // Always set the apikey header to ensure it's present and correct
    // Use the environment variable for the API key
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseAnonKey) {
      requestHeaders.set('apikey', supabaseAnonKey);
      // Set content type for JSON requests
      requestHeaders.set('Content-Type', 'application/json');
    }

    // Create a new request with the modified headers
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    return response;
  }

  // For all other requests, continue without modification
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  // Match all API routes that might go to Supabase
  matcher: [
    '/(api|rest)/:path*',
    '/:path*', // Intercept all requests to ensure Supabase requests are properly handled
  ],
};