'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import JobCard from '@/components/job-card';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { type JobPosting } from '@/types'; // Import the type
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';

export default function Home() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([]);
  const [locationFilter, setLocationFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient(); // Get the Supabase client

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!supabase) {
        setError('Supabase client is not initialized. Please make sure the code is running in a browser environment.');
        setLoading(false);
        return;
      }
    try {
        const { data, error } = await supabase
            .from('job_postings')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) {
             console.error('Supabase fetch error:', error);
            setError(
                `Failed to fetch job listings. Error: ${error.message || 'Unknown error'}.` 
            );
            return;
        }
         setJobs(data || []);
         setFilteredJobs(data || []);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [supabase]); // Include supabase in dependencies


  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Debounced filter function
  const debouncedFilterJobs = useCallback(() => {
      const lowerCaseFilter = locationFilter.toLowerCase().trim();
      if (lowerCaseFilter === '') {
          setFilteredJobs(jobs);
      } else {
          const filtered = jobs.filter(job =>
              job.location.toLowerCase().includes(lowerCaseFilter)
          );
          setFilteredJobs(filtered);
      }
  }, [locationFilter, jobs]);


  // Apply filter when locationFilter changes (with debounce)
  useEffect(() => {
      const handler = setTimeout(() => {
          debouncedFilterJobs();
      }, 300); // 300ms debounce

      return () => {
          clearTimeout(handler);
      };
  }, [locationFilter, debouncedFilterJobs]);


  const handleClearFilter = () => {
    setLocationFilter('');
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-3 shadow">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-16 w-full" />
          <div className="flex justify-end">
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      ))}
    </div>
  );


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-center text-primary">Find Your Next Opportunity</h1>

      <div className="flex items-center gap-2 max-w-lg mx-auto">
        <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                type="text"
                placeholder="Filter by location (e.g., New York, Remote)"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="pl-10 pr-10" // Add padding for icons
                aria-label="Filter jobs by location"
            />
            {locationFilter && (
                <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 text-muted-foreground hover:bg-transparent"
                onClick={handleClearFilter}
                aria-label="Clear location filter"
                >
                <X className="h-4 w-4" />
                </Button>
            )}
        </div>

      </div>

      {error && (
         <Alert variant="destructive" className="max-w-3xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Fetching Jobs</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
         </Alert>
       )}

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {filteredJobs.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {filteredJobs.map((job) => (
                 <JobCard key={job.id} job={job} />
               ))}
             </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">
                    {jobs.length > 0 && locationFilter
                        ? `No jobs found matching "${locationFilter}". Try clearing the filter.`
                        : 'No job postings available at the moment.'}
                </p>
                {jobs.length > 0 && locationFilter && (
                    <Button variant="link" onClick={handleClearFilter} className="mt-2 text-accent">Clear Filter</Button>
                )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
