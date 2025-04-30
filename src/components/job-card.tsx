import Link from 'next/link';
import { Building, MapPin } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type JobPosting } from '@/types'; // Import the type

interface JobCardProps {
  job: JobPosting;
}

export default function JobCard({ job }: JobCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold truncate">{job.title}</CardTitle>
        <div className="flex items-center text-sm text-muted-foreground gap-2 pt-1">
          <Building className="w-4 h-4" />
          <span>{job.company_name}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
         <div className="flex items-center text-sm text-muted-foreground gap-2">
            <MapPin className="w-4 h-4" />
            <Badge variant="secondary">{job.location}</Badge>
         </div>
        <p className="mt-3 text-sm line-clamp-3 text-foreground/80">
          {job.description}
        </p>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Link href={`/job/${job.id}`} passHref>
          <Button variant="outline" size="sm" className="border-accent text-accent hover:bg-accent/10 hover:text-accent">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
