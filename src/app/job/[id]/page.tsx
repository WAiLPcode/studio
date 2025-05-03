'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building, MapPin, Info, CheckCircle, Briefcase, TrendingUp, DollarSign, CalendarClock, Clock } from 'lucide-react'; // Added icons
import { Skeleton } from '@/components/ui/skeleton';
import { type JobPosting } from '@/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns'; // Import date formatting
import { supabaseClient } from '@/lib/supabase/client';


export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
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
             .select('*')
             .eq('id', jobId)
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
         setJob(data);
     } catch (err: any) {
      console.error('Unexpected fetch error:', err);
      setError(err.message || 'An unexpected error occurred.');
       setJob(null);
     } finally {
      setLoading(false);
     }
  }, [jobId, ]);

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
   // Since we've already checked for null job above, we can safely assert job is non-null here
   // TypeScript still needs help understanding this
   const timeAgo = job?.created_at ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true }) : '';
   const expiryDate = job?.expires_at ? format(new Date(job.expires_at), 'PPP') : 'N/A'; // Format expiry date
   return (
     <div className="max-w-3xl mx-auto space-y-4">
       <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4 hover:bg-secondary/80 transition-colors hover:bg-slate-100 hover:text-black">
         <ArrowLeft className="mr-2 h-4 w-4" /> Back to Listings
       </Button>
       <Card className="shadow-lg border rounded-lg overflow-hidden">
         <CardHeader className="bg-card pb-4">
           <CardTitle className="text-2xl font-bold text-primary">{job?.title}</CardTitle>
           <CardDescription className="pt-2 space-y-1.5">
             <div className="flex items-center gap-2 text-muted-foreground">
               <Building className="w-4 h-4 flex-shrink-0" />
               <span>{job?.company_name}</span>
             </div>
             <div className="flex items-center gap-2 text-muted-foreground">
               <MapPin className="w-4 h-4 flex-shrink-0" />
               <span>{job?.location}</span>
             </div>
             {/* Display Badges */}
             <div className="flex flex-wrap gap-2 pt-2">
               {job?.employment_type && (
                 <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                   <Briefcase className="w-3 h-3" /> {job?.employment_type}
                 </Badge>
               )}
               {job?.experience_level && (
                 <Badge variant="outline" className="flex items-center gap-1 text-xs">
                   <TrendingUp className="w-3 h-3" /> {job?.experience_level}
                 </Badge>
               )}
               {(job?.salary_min != null || job?.salary_max != null) && (
                 <Badge variant="outline" className="flex items-center gap-1 text-xs border-green-500 text-green-700">
                   <DollarSign className="w-3 h-3" />
                   {job?.salary_min != null ? `$${job?.salary_min.toLocaleString()}` : ''}
                   {job?.salary_min != null && job?.salary_max != null ? ' - ' : ''}
                   {job?.salary_max != null ? `$${job?.salary_max.toLocaleString()}` : ''}
                   {job?.salary_currency && ` ${job?.salary_currency}`}
                 </Badge>
               )}
             </div>
           </CardDescription>
         </CardHeader>
         <CardContent className="pt-6 space-y-6">
           {/* Job Description Section */}
           <div>
             <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-primary">
               <Info className="w-5 h-5 text-accent" />
               Job Description
             </h3>
             <div className="prose prose-sm max-w-none text-foreground/90 whitespace-pre-wrap">
               {job?.description}
             </div>
           </div>
           {/* Application Instructions Section */}
           <div>
             <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-primary">
               <CheckCircle className="w-5 h-5 text-accent" />
               How to Apply
             </h3>
             <div className="prose prose-sm max-w-none text-foreground/90 whitespace-pre-wrap">
               {job?.application_instructions}
             </div>
           </div>
         </CardContent>
         {/* Footer with Metadata */}
         <div className="bg-secondary/50 px-6 py-3 border-t text-xs text-muted-foreground flex justify-between items-center">
           <div className="flex items-center gap-1">
             <Clock className="w-3 h-3" />
             Posted {timeAgo}
           </div>
           {job.expires_at && (
             <div className="flex items-center gap-1">
               <CalendarClock className="w-3 h-3" />
               Expires on: {expiryDate}
             </div>
           )}
         </div>
       </Card>
     </div>
   );
}
