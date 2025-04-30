'use client';

import Link from 'next/link';
import { Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-card border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary hover:text-accent transition-colors">
          <Briefcase className="w-6 h-6 text-accent" />
          <span className="text-xl font-bold">JobFinder</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" passHref>
            <Button
              variant={isActive('/') ? 'default' : 'ghost'}
              className={cn(
                'transition-colors',
                isActive('/') ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'hover:bg-secondary'
              )}
              aria-current={isActive('/') ? 'page' : undefined}
            >
              Home
            </Button>
          </Link>
          <Link href="/post-job" passHref>
             <Button
                variant={isActive('/post-job') ? 'default' : 'outline'}
                className={cn(
                    'transition-colors',
                    isActive('/post-job') ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'border-accent text-accent hover:bg-accent/10'
                )}
                aria-current={isActive('/post-job') ? 'page' : undefined}
                >
                Post a Job
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
