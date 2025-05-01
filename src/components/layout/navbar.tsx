'use client';

import Link from 'next/link';
import { Briefcase, LogIn, UserPlus, LogOut, User, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { memo } from 'react';

function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (path: string) => pathname === path;

  // Memoize the active state calculation to prevent unnecessary recalculations
  const homeActive = isActive('/');
  const postJobActive = isActive('/post-job');
  const loginActive = isActive('/login');
  const registerActive = isActive('/register');

  const handleLogout = async () => {
    await logout();
    // No need to redirect, the auth context will handle it
  };

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
              variant={homeActive ? 'default' : 'ghost'}
              className={cn(
                'transition-colors',
                homeActive ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'hover:bg-secondary'
              )}
              aria-current={homeActive ? 'page' : undefined}
            >
              Home
            </Button>
          </Link>
          
          {/* Show Post Job button only for employers */}
          {user && user.role === 'employer' && (
            <Link href="/post-job" passHref>
              <Button
                variant={postJobActive ? 'default' : 'outline'}
                className={cn(
                  'transition-colors',
                  postJobActive ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'border-accent text-accent hover:bg-accent/10'
                )}
                aria-current={postJobActive ? 'page' : undefined}
              >
                Post a Job
              </Button>
            </Link>
          )}
          
          {/* Authentication buttons */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Show user role indicator */}
                <div className="flex items-center mr-2 text-sm text-muted-foreground">
                  {user.role === 'employer' ? (
                    <>
                      <Building2 className="h-4 w-4 mr-1" />
                      <span>Employer</span>
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4 mr-1" />
                      <span>Job Seeker</span>
                    </>
                  )}
                </div>
                
                {/* Logout button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="hover:bg-secondary"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                {/* Login button */}
                <Link href="/login" passHref>
                  <Button
                    variant={loginActive ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      'transition-colors',
                      loginActive ? 'bg-accent text-accent-foreground hover:bg-accent/90 ' : 'bg-slate-300 hover:bg-secondary hover:text-black'
                    )}
                    aria-current={loginActive ? 'page' : undefined}
                  >
                    <LogIn className="h-4 w-4 mr-1" />
                    Login
                  </Button>
                </Link>
                
                {/* Register button */}
                <Link href="/register" passHref>
                  <Button
                    variant={registerActive ? 'default' : 'secondary'}
                    size="sm"
                    className={cn(
                      'transition-colors',
                      registerActive ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''
                    )}
                    aria-current={registerActive ? 'page' : undefined}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// Export a memoized version of the Navbar component to prevent unnecessary re-renders
export default memo(Navbar);
