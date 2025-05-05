
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types';
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
        .from('employer_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
      if (error.message === 'Multiple objects found') {
        throw new Error('Multiple objects found');
      }
      console.error('Error fetching employer profile:', error);
    }

    if (!data) {
      const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email, company_name, company_website, industry, company_description, company_logo_url, company_size')
          .eq('id', userId)
          .single();

      if (userError) console.error('Error fetching user email:', userError);

      if (!userData) {
        return NextResponse.json({
          companyName: '',
          email: '',
          companyWebsite: '',
          industry: '',
          companyDescription: '',
          companyLogoUrl: '',
          companySize: '',
        });
      }
      return NextResponse.json({
      });
    }

    return NextResponse.json({
      companyName: data?.company_name || '',
      email: data?.email || '',
      companyWebsite: data?.company_website || '',
      industry: data?.industry || '',
      companyDescription: data?.company_description || '',
      companyLogoUrl: data?.company_logo_url || '',
      companySize: data?.company_size || '',
    });
  } catch (error) {
    console.error('Error fetching employer profile:', error);
    return NextResponse.json(
      { error: 'Error fetching employer profile' },
      { status: 500 },
    )
  }
}


export const POST = async (request: Request) => {
  const body = await request.json();
  const {
    userId,
    companyName,
    email,
    companyWebsite,
    industry,
    companyDescription,
    companyLogoUrl,
    companySize,
  } = body;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const supabase = createRouteHandlerClient<Database>({ cookies });

  try {
    const { error } = await supabase.from('employer_profiles').upsert({
      user_id: userId,
      company_name: companyName,
      email: email,
      company_website: companyWebsite,
      industry: industry,
      company_description: companyDescription,
      company_logo_url: companyLogoUrl,
      company_size: companySize,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating employer profile:', error);
    return NextResponse.json({ error: 'Error updating employer profile' }, { status: 500 });
  }
};