import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      // Exchange the code for a session
      const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (sessionError) {
        console.error('Session exchange error:', sessionError);
        return NextResponse.redirect(
          new URL('/login?message=Error authenticating. Please try again.&status=error', request.url)
        );
      }

      if (!session?.user) {
        return NextResponse.redirect(
          new URL('/login?message=No user found in session. Please try again.&status=error', request.url)
        );
      }
      
      // After successful verification, ensure the user record exists in our users table
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (userError || !existingUser) {
        // User exists in auth but not in our users table
        // Create a basic user record with job_seeker as default role
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: session.user.id,
            email: session.user.email,
            password_hash: 'verified_via_email',
            role: 'job_seeker', // Default role
          }]);
        
        if (insertError) {
          console.error('Error creating user record:', insertError);
          return NextResponse.redirect(
            new URL('/login?message=Error creating user account. Please contact support.&status=error', request.url)
          );
        }
      }

      // Redirect to the appropriate page based on user role
      const redirectUrl = existingUser?.role === 'employer' ? '/post-job' : '/';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    } catch (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(
        new URL('/login?message=An unexpected error occurred. Please try again.&status=error', request.url)
      );
    }
  }

  // If no code is present, redirect to login
  return NextResponse.redirect(new URL('/login', request.url));
} 