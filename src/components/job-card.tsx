import Link from 'next/link';
import { Building, MapPin, Briefcase, TrendingUp, Clock } from 'lucide-react'; // Added icons
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type JobPosting } from '@/types';
import { formatDistanceToNow } from 'date-fns'; // For relative time

interface JobCardProps {
  job: JobPosting;
}

export default function JobCard({ job }: JobCardProps) {
  const timeAgo = job.created_at ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true }) : '';

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 flex flex-col h-full border rounded-lg overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-primary truncate">{job.title}</CardTitle>
        <CardDescription className="flex items-center text-sm text-muted-foreground gap-2 pt-1">
          <Building className="w-4 h-4 flex-shrink-0" />
          <span className='truncate'>{job.company_name}</span>
        </CardDescription>
         <div className="flex items-center text-sm text-muted-foreground gap-2 pt-1">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{job.location}</span>
         </div>
      </CardHeader>
      <CardContent className="flex-grow pt-0 pb-4 space-y-2">
        {/* Badges for key info */}
        <div className="flex flex-wrap gap-2">
            {job.employment_type && (
                <Badge variant="secondary" className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> {job.employment_type}
                </Badge>
            )}
             {job.experience_level && (
                <Badge variant="outline" className="flex items-center gap-1">
                   <TrendingUp className="w-3 h-3" /> {job.experience_level}
                </Badge>
            )}
        </div>
         {/* Salary Info */}
         {(job.salary_min || job.salary_max) && (
          <div className="text-sm text-foreground/80 font-medium">
            Salary: {job.salary_min ? `$${job.salary_min.toLocaleString()}` : ''}
            {job.salary_min && job.salary_max ? ' - ' : ''}
            {job.salary_max ? `$${job.salary_max.toLocaleString()}` : ''}
            {job.salary_currency && ` ${job.salary_currency}`}
          </div>
        )}
         {/* Description Snippet */}
        <p className="text-sm line-clamp-3 text-foreground/80">
          {job.description}
        </p>
         {/* Posted Time */}
         {timeAgo && (
             <div className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                 <Clock className="w-3 h-3" />
                Posted {timeAgo}
            </div>
         )}
      </CardContent>
      <CardFooter className="flex justify-end border-t pt-4 pb-4 pr-4">
        <Link href={`/job/${job.id}`} passHref>
          <Button variant="outline" size="sm" className="border-accent text-accent hover:bg-accent/10 hover:text-accent">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
