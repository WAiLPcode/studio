'use client';

import Link from 'next/link'
import { Briefcase, LogIn, UserPlus, LogOut, User, Building2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { memo, useMemo, useCallback } from 'react';

function Navbar() {
  const pathname = usePathname()
  const { user, logout } = useAuth();

  // Memoize the active state calculations to prevent unnecessary recalculations
  const navState = useMemo(() => {
    return {
      homeActive: pathname === '/',
      postJobActive: pathname === '/post-job',
      loginActive: pathname === '/login',
      registerActive: pathname === '/register'
    };
  }, [pathname]);

  const handleLogout = useCallback(async () => {
    await logout()
  }, [logout])

  return (
    <nav className="bg-card border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary hover:text-accent transition-colors">
          <Briefcase className="w-6 h-6 text-accent" />
          <span className="text-xl font-bold">JobFinder</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" prefetch={true} passHref>
            <Button
              variant={navState.homeActive ? 'default' : 'ghost'}
              className={cn(
                'transition-colors',
                navState.homeActive ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'bg-slate-300 hover:text-black hover:bg-slate-200'
              )}
              aria-current={navState.homeActive ? 'page' : undefined}
            >
              Home
            </Button>
          </Link>
          
          {/* Show Post Job button only for employers */}
          {user && user.role === 'employer' && (
            <Link href="/post-job" prefetch={true} passHref>
              <Button
                variant={navState.postJobActive ? 'default' : 'outline'}
                className={cn(
                  'transition-colors',
                  navState.postJobActive ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'border-accent text-accent hover:bg-accent/10'
                )}
                aria-current={navState.postJobActive ? 'page' : undefined}
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
                <div className="flex items-center mr-2 text-sm text-muted-foreground"></div>
                <Link
                  href={user.role === 'employer' ? '/employer-profile' : '/job-seeker-profile'}
                >
                  <Button variant="ghost" className="hover:bg-secondary">
                    <Edit className="h-4 w-4 mr-1" />
                    Profile
                  </Button>
                </Link>
                
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
                <Link href="/login" prefetch={true} passHref>
                  <Button
                    variant={navState.loginActive ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      'transition-colors',
                      navState.loginActive ? 'bg-accent text-accent-foreground hover:bg-accent/90 ' : 'bg-slate-300 hover:bg-secondary hover:text-black'
                    )}
                    aria-current={navState.loginActive ? 'page' : undefined}
                  >
                    <LogIn className="h-4 w-4 mr-1" />
                    Login
                  </Button>
                </Link>
                
                {/* Register button */}
                <Link href="/register" prefetch={true} passHref>
                  <Button
                    variant={navState.registerActive ? 'default' : 'secondary'}
                    size="sm"
                    className={cn(
                      'transition-colors',
                      navState.registerActive ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''
                    )}
                    aria-current={navState.registerActive ? 'page' : undefined}
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
//Export a memoized version of the Navbar component to prevent unnecessary re-renders
export default memo(Navbar);
