'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building, MapPin, Info, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { type JobPosting } from '@/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';


export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();


  const fetchJobDetails = useCallback(async () => {
    if (!jobId) return;
    if (!supabase) {
      setError(
        'Supabase client is not initialized. Please make sure the code is running in a browser environment.'
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('id', jobId)
        .single(); // Expect a single result

      if (error) {
         console.error('Supabase fetch error:', error);
          if (error.code === 'PGRST116') {
             setError(`Job with ID ${jobId} not found.`);
          } else {
              setError(`Failed to fetch job details. Error: ${error.message || 'Unknown error'}.`);
          }
          return;
      }
       if (!data) {
         setError(`Job with ID ${jobId} not found.`);
       }
      setJob(data);
    } catch (err: any) { // we no longer throw an error, so we always enter here
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [jobId, supabase]);

  if (!supabase) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Error Loading Job</AlertTitle>
          <AlertDescription>Supabase client is not initialized. Please make sure the code is running in a browser environment.</AlertDescription>
        </Alert>
      </div>
    );
  }

  useEffect(() => {
     fetchJobDetails();
   }, [fetchJobDetails]);


  const LoadingSkeleton = () => (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-5 w-1/4 mt-1" />
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
         <div className="flex justify-start mt-6">
            <Skeleton className="h-10 w-24" />
         </div>
      </CardContent>
    </Card>
  );


  if (loading) {
    return (
        <div className="max-w-3xl mx-auto space-y-4">
             <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4" disabled>
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
    // This case should ideally be handled by the error state, but added for robustness
     return (
        <div className="max-w-3xl mx-auto text-center py-12 text-muted-foreground">
            <p className="text-lg">Job not found.</p>
             <Link href="/" passHref>
                 <Button variant="link" className="mt-2 text-accent">Return to Listings</Button>
            </Link>
        </div>
     );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
       <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4 hover:bg-secondary/80">
         <ArrowLeft className="mr-2 h-4 w-4" /> Back to Listings
       </Button>

       <Card className="shadow-md">
         <CardHeader>
           <CardTitle className="text-2xl font-bold text-primary">{job.title}</CardTitle>
           <CardDescription className="pt-2 space-y-1">
             <div className="flex items-center gap-2 text-muted-foreground">
               <Building className="w-4 h-4" />
               <span>{job.company_name}</span>
             </div>
             <div className="flex items-center gap-2 text-muted-foreground">
               <MapPin className="w-4 h-4" />
               <span>{job.location}</span>
             </div>
           </CardDescription>
         </CardHeader>
         <CardContent className="space-y-6">
           <div>
             <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-primary">
                <Info className="w-5 h-5 text-accent" />
                Job Description
             </h3>
             {/* Use whitespace-pre-wrap to preserve formatting like line breaks */}
             <p className="text-foreground/90 whitespace-pre-wrap">{job.description}</p>
           </div>
           <div>
             <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-primary">
               <CheckCircle className="w-5 h-5 text-accent" />
                How to Apply
             </h3>
             <p className="text-foreground/90 whitespace-pre-wrap">{job.application_instructions}</p>
           </div>

           {/* Optional Apply Button - can link externally if provided */}
            {/*
           <div className="pt-4">
               <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Apply Now (Example)
               </Button>
           </div>
            */}
         </CardContent>
       </Card>
    </div>
  );
}
