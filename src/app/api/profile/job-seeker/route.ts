import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    throw new Error('User ID is required');
  }

  const supabase = createRouteHandlerClient<Database>({ cookies });

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
        if (error.message === 'Multiple objects found') {
            throw new Error('Multiple objects found');
          }
      return NextResponse.json({
        firstName: '',
        lastName: '',
        email: '',
        professionalHeadline: '',
        bio: '',
        phoneNumber: '',
        profilePictureUrl: '',
        resumeUrl: '',
        websiteUrl: '',
        linkedinUrl: '',
        githubUrl: '',
      });
    }

    return NextResponse.json({ 
      firstName: data?.first_name || '',
      lastName: data?.last_name || '',
      email: data?.email || '',
      professionalHeadline: data?.headline || '',
      bio: data?.bio || '',
      phoneNumber: data?.phone_number || '',
      profilePictureUrl: data?.profile_picture_url || '',
      resumeUrl: data?.resume_url || '',
      websiteUrl: data?.website_url || '',
      linkedinUrl: data?.linkedin_url || '',
      githubUrl: data?.github_url || '',
    });
  } catch (error) {
    console.error('Error fetching job seeker profile:', error);
    return NextResponse.json({ error: 'Error fetching job seeker profile' }, { status: 500 });
  }
};

export const POST = async (request: Request) => {
  const body = await request.json();
  const { userId, firstName, lastName, email, professionalHeadline, bio, phoneNumber, profilePictureUrl, resumeUrl, websiteUrl, linkedinUrl, githubUrl } = body;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const supabase = createRouteHandlerClient<Database>({ cookies });

  try {
    const { error } = await supabase.from('user_profiles').upsert({
      user_id: userId,
      first_name: firstName,
      last_name: lastName,
      email: email,
      headline: professionalHeadline,
      bio: bio,
      phone_number: phoneNumber,
      profile_picture_url: profilePictureUrl,
      resume_url: resumeUrl,
      website_url: websiteUrl,
      linkedin_url: linkedinUrl,
      github_url: githubUrl,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating job seeker profile:', error);
    return NextResponse.json({ error: 'Error updating job seeker profile' }, { status: 500 });
  }
};