import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Define the pending registration data interface
interface PendingRegistrationData {
  role: string;
  company_name?: string;
  company_website?: string;
  company_description?: string;
  industry?: string;
  first_name?: string;
  last_name?: string;
  headline?: string;
  bio?: string;
  [key: string]: any; // Allow for additional properties
}

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
      
      // Check for existing user record
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      // If we find a record, use it for redirection
      if (!userCheckError && existingUser) {
        // Redirect to the appropriate page based on user role
        const redirectUrl = existingUser.role === 'employer' ? '/post-job' : '/';
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }
      
      // Try to retrieve registration data from sessionStorage first
      let userData: PendingRegistrationData = { role: 'job_seeker' }; // Default to job_seeker
      
      // Check for pending registration data in the database
      const { data: pendingData, error: pendingError } = await supabase
        .from('pending_registrations')
        .select('*')
        .eq('email', session.user.email)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (!pendingError && pendingData && pendingData.length > 0) {
        userData = pendingData[0] as PendingRegistrationData;
      }
      
      // Create a user record with the correct role
      const userRole = userData.role || 'job_seeker';
      
      // Insert the user record
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: session.user.id,
          email: session.user.email,
          password_hash: 'verified_via_email',
          role: userRole
        }]);
      
      if (insertError) {
        console.error('Error creating user record:', insertError);
        return NextResponse.redirect(
          new URL('/login?message=Error creating user account. Please contact support.&status=error', request.url)
        );
      }
      
      // Create the appropriate profile
      if (userRole === 'employer') {
        // Create employer profile
        const { error: profileError } = await supabase
          .from('employer_profiles')
          .insert([{
            user_id: session.user.id,
            company_name: userData.company_name || 'Company',
            company_website: userData.company_website || '',
            company_description: userData.company_description || '',
            industry: userData.industry || '',
            email: session.user.email,
            contact_first_name: userData.first_name || 'Contact',
            contact_last_name: userData.last_name || 'Person'
          }]);
          
        if (profileError) {
          console.error('Error creating employer profile:', profileError);
          // Redirect anyway but with a warning
          return NextResponse.redirect(
            new URL('/post-job?message=Your account was created, but there was an issue with your employer profile. Please complete your profile.&status=warning', request.url)
          );
        }
      } else {
        // Create job seeker profile
        const { error: profileError } = await supabase
          .from('job_seeker_profiles')
          .insert([{
            user_id: session.user.id,
            first_name: userData.first_name || 'New',
            last_name: userData.last_name || 'User',
            headline: userData.headline || '',
            bio: userData.bio || ''
          }]);
          
        if (profileError) {
          console.error('Error creating job seeker profile:', profileError);
          // Redirect anyway but with a warning
          return NextResponse.redirect(
            new URL('/?message=Your account was created, but there was an issue with your profile. Please complete your profile.&status=warning', request.url)
          );
        }
      }
      
      // Clean up the pending registration if any
      if (pendingData && pendingData.length > 0) {
        await supabase
          .from('pending_registrations')
          .delete()
          .eq('id', pendingData[0].id);
      }
      
      // Redirect to the appropriate page based on the user's role with success message
      const redirectUrl = userRole === 'employer' 
        ? '/post-job?message=Your employer account has been successfully created!&status=success' 
        : '/?message=Your job seeker account has been successfully created!&status=success';
        
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