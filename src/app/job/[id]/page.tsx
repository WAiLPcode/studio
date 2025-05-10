'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Added icons
import { ArrowLeft, Building, MapPin, Info, CheckCircle, Briefcase, TrendingUp, DollarSign, CalendarClock, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { type JobPosting, type JobPostingWithEmployerProfile } from '@/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns'; // Import date formatting
import { supabaseClient } from '@/lib/supabase/client'; // Import supabase client

// Main component that uses searchParams - wrapped in Suspense
function JobDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = params.id as string;
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const LoadingSkeleton = () => (
    <Card className="max-w-3xl mx-auto shadow-md">
      <CardHeader>
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-5 w-1/2 mb-1" />
        <Skeleton className="h-5 w-1/4 mb-3" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Skeleton className="h-6 w-1/3 mb-2" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div>
          <Skeleton className="h-6 w-1/3 mb-2" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="flex justify-between items-center text-xs mt-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-36" />
        </div>
      </CardContent>
    </Card>
  );
  
  if (!supabaseClient) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Job</AlertTitle>
          <AlertDescription>Supabase client is not initialized. Please check your setup.</AlertDescription>
        </Alert>
        <Link href="/" passHref>
          <Button variant="link" className="text-accent">Go Home</Button>
        </Link>  
      </div>
    );
  }
  
  const fetchJobDetails = useCallback(async () => {
    if (!jobId || !supabaseClient) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabaseClient
        .from('job_postings')
        .select(
          `
            *,
            users!job_postings_employer_user_id_fkey(
              employer_profiles!user_profiles_user_id_fkey(
                company_name,
                company_website
              )
            )
          `
        )
        .eq('id', jobId)
        .throwOnError()
        .single();

      if (fetchError) {
        console.error('Supabase fetch error:', fetchError);
        if (fetchError.code === 'PGRST116') {
          setError(`Job with ID ${jobId} not found.`);
        } else {
          setError(
            `Failed to fetch job details. Error: ${fetchError.message || 'Unknown error'}.`
          );
        }
        setJob(null);
        return;
      }
      
      if (!data) {
        setError(`Job with ID ${jobId} not found.`);
        setJob(null);
        return;
      }

      console.log('Job data structure:', JSON.stringify(data, null, 2));

      setJob({
        ...data,
        users: undefined,
        company_name: data.users?.employer_profiles?.company_name || 'Company name not available',
        company_website: data.users?.employer_profiles?.company_website
      });
      
      console.log('Raw data structure:', {
        users: data.users,
        employer_profiles: data.users?.employer_profiles
      });
    } catch (err: any) {
      console.error('Unexpected fetch error:', err);
      setError(err.message || 'An unexpected error occurred.');
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    } else {
      setError("Job ID is missing.");
    }
  }, [jobId, fetchJobDetails]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Listings
        </Button>
        <LoadingSkeleton />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Listings
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Job</AlertTitle>
          <AlertDescription>
            {error} Please try again or return to the listings.
          </AlertDescription>
        </Alert>
        <Link href="/" passHref>
          <Button variant="link" className="text-accent">Go Home</Button>
        </Link>
      </div>
    );
  }
  
  if (!job) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12 text-muted-foreground">
        <p className="text-lg">Job not found.</p>
      </div>
    );
  }
  
  const timeAgo = job?.posted_at ? formatDistanceToNow(new Date(job.posted_at), { addSuffix: true }) : '';
  const expiryDate = job?.expires_at ? format(new Date(job.expires_at), 'PPP') : 'N/A';
  
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4 hover:bg-secondary/80 transition-colors hover:bg-slate-100 hover:text-black">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Listings
      </Button>

      <Card className="max-w-3xl mx-auto shadow-md">
        {/* Job header with title and company name */}
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">{job.job_title}</CardTitle>
              <CardDescription className="flex items-center mt-1">
                <Building className="h-4 w-4 mr-1 text-muted-foreground" />
                <span>{job.company_name || 'Company'}</span>
              </CardDescription>
              {job.location && (
                <CardDescription className="flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>{job.location}</span>
                </CardDescription>
              )}
            </div>
            <div>
              <a 
                href={`/apply/${job.id}`}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md inline-block no-underline"
              >
                Apply Now
              </a>
            </div>
          </div>

          {/* Job badges/tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {job.employment_type && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {job.employment_type}
              </Badge>
            )}
            {job.experience_level && (
              <Badge variant="outline" className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {job.experience_level}
              </Badge>
            )}
            {job.salary_min && job.salary_max && (
              <Badge variant="outline" className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {`${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} ${job.salary_currency || 'USD'}`}
              </Badge>
            )}
            {job.posted_at && (
              <Badge variant="outline" className="flex items-center gap-1">
                <CalendarClock className="h-3 w-3" />
                Posted {timeAgo}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Job description */}
          <div>
            <h2 className="text-lg font-semibold mb-2 flex items-center">
              <Info className="h-5 w-5 mr-2 text-primary" />
              Job Description
            </h2>
            <div className="whitespace-pre-line text-pretty">
              {job.job_description}
            </div>
          </div>

          {/* Application instructions */}
          {job.application_instructions && (
            <div>
              <h2 className="text-lg font-semibold mb-2 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-primary" />
                How to Apply
              </h2>
              <div className="whitespace-pre-line">
                {job.application_instructions}
              </div>
            </div>
          )}

          {/* Job metadata at the bottom */}
          <div className="border-t pt-4 mt-8 flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Expires: {expiryDate}
            </div>
            <div>
              Job ID: {job.id.substring(0, 8)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Wrapped main page component
export default function JobDetailPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto space-y-4">
        <Card className="max-w-3xl mx-auto shadow-md">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-5 w-1/2 mb-1" />
            <Skeleton className="h-5 w-1/4 mb-3" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-32" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Skeleton className="h-6 w-1/3 mb-2" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div>
              <Skeleton className="h-6 w-1/3 mb-2" />
              <Skeleton className="h-12 w-full" />
            </div>
            <div className="flex justify-between items-center text-xs mt-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-36" />
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <JobDetailContent />
    </Suspense>
  )
}
