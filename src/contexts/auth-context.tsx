'use client';

// import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Assuming Next.js navigation
import { useToast } from "@/hooks/use-toast";

type UserRole = 'job_seeker' | 'employer' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any, role: UserRole) => Promise<void>;
  isRateLimited: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitResetTime, setRateLimitResetTime] = useState<Date | null>(null);
  // State for registration and verification moved here
  const [registrationUser, setRegistrationUser] = useState<any>(null); // To store userData during verification
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const { toast } = useToast(); // Added initialization
  const router = useRouter(); // Assuming router is used or will be
  // Use the imported supabaseClient directly
  useEffect(() => {
    // Check for stored user in localStorage
    const storedUser = localStorage.getItem('jobfinder_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('jobfinder_user');
      }
    }
    
    // Set up Supabase auth state listener
    if (supabaseClient) {
      const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user && supabaseClient) {
          // Fetch user role from the users table
          const { data: userData, error: userError } = await supabaseClient
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (!userError && userData) {
            const userObj: User = {
              id: session.user.id,
              email: session.user.email || '',
              role: userData.role as UserRole,
            };
            setUser(userObj);
            localStorage.setItem('jobfinder_user', JSON.stringify(userObj));
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('jobfinder_user');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
    
    // Check for stored rate limit information
    const storedRateLimit = localStorage.getItem('jobfinder_rate_limit');
    if (storedRateLimit) {
      try {
        const rateLimitData = JSON.parse(storedRateLimit);
        if (rateLimitData.limited) {
          const resetTime = new Date(rateLimitData.resetTime);
          if (resetTime > new Date()) {
            setIsRateLimited(true);
            setRateLimitResetTime(resetTime);
          } else {
            localStorage.removeItem('jobfinder_rate_limit');
          }
        }
      } catch (error) {
        console.error('Failed to parse rate limit data:', error);
        localStorage.removeItem('jobfinder_rate_limit');
      }
    }
    
    setIsLoading(false);
  }, []);

  const createProfile = async (userId: string, userData: any, profileType: 'job_seeker_profiles' | 'employer_profiles' ) => {
    try {
        if (!supabaseClient) throw new Error('Database connection not available');
        
        // Check for active session before proceeding
        const { data: sessionData } = await supabaseClient.auth.getSession();
        if (!sessionData.session) {
          console.warn('No active session when creating profile');
        }
        
        if(profileType === 'job_seeker_profiles'){
          // For job_seeker_profiles table
          const { error } = await supabaseClient
          .from('job_seeker_profiles')
          .insert([{
            user_id: userId,
            first_name: userData.firstName,
            last_name: userData.lastName || '',
            headline: userData.headline || '',
            bio: userData.bio || '',
            location: userData.location || '',
            skills: userData.skills || [],
            experience_years: userData.experienceYears || 0
          }]);
          
          if (error) {
            console.error('Profile creation error:', error);
            throw new Error(`Database error creating profile: ${error.message}`);
          }
        } else {
          // For employer_profiles table
          const { error } = await supabaseClient
          .from('employer_profiles')
          .insert([{
            user_id: userId,
            company_name: userData.companyName,
            contact_first_name: userData.firstName,
            contact_last_name: userData.lastName || '',
            company_website: userData.companyWebsite || '',
            company_description: userData.companyDescription || '',
            industry: userData.industry || '',
            company_size: userData.companySize || '',
            company_founded_year: userData.companyFoundedYear || null,
            company_locations: userData.companyLocations || []
          }]);
          
          if (error) {
            console.error('Profile creation error:', error);
            throw new Error(`Database error creating profile: ${error.message}`);
          }
        }
    } catch (error) {
      console.error('Profile creation exception:', error);
      throw new Error((error as any)?.message || 'Database error creating profile');
    }
  }
  const login = async (email: string, password: string) => {
    if (!supabaseClient) throw new Error('Database connection not available');
    
    setIsLoading(true);
    try {
      // Authenticate with Supabase
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error || !data?.user) {
        throw new Error('Invalid email or password');
      }

      // Fetch user role from the users table
      const { data: userData, error: userError } = await supabaseClient
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        console.error('Error fetching user role:', userError);
        
        // Check if there's any profile for this user to determine their role
        const { data: employerProfile } = await supabaseClient
          .from('employer_profiles')
          .select('user_id')
          .eq('user_id', data.user.id)
          .maybeSingle();
          
        const { data: jobSeekerProfile } = await supabaseClient
          .from('job_seeker_profiles')
          .select('user_id')
          .eq('user_id', data.user.id)
          .maybeSingle();
        
        // Determine the role based on existing profiles
        let userRole: UserRole = 'job_seeker'; // Default
        if (employerProfile) {
          userRole = 'employer';
        } else if (jobSeekerProfile) {
          userRole = 'job_seeker';
        }
        
        // Create a user record with the determined role
        const { error: insertError } = await supabaseClient.from('users').insert([{ 
          id: data.user.id, 
          email: data.user.email || '', 
          password_hash: 'verified_via_login', 
          role: userRole
        }]);
        
        if (insertError) {
          console.error('Error creating user record during login:', insertError);
          throw new Error('Error creating user profile. Please contact support.');
        }
        
        // Set the determined role for the user
        const userObj: User = {
          id: data.user.id,
          email: data.user.email || '',
          role: userRole,
        };
        
        setUser(userObj);
        localStorage.setItem('jobfinder_user', JSON.stringify(userObj));
        return;
      }

      const userObj: User = {
        id: data.user?.id || '',
        email: data.user?.email || '',
        role: userData?.role as UserRole || null,
      };

      setUser(userObj);
      localStorage.setItem('jobfinder_user', JSON.stringify(userObj));
    } catch(error) {
      console.error('Login error:', error);
      throw new Error((error as any)?.message || 'Failed to login user');
    } finally {
      setIsLoading(false);
    }
  };
  const logout = async () => {
    setUser(null);
    localStorage.removeItem('jobfinder_user');
  };
  // Helper function to delay execution for a specified time
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // VerificationPopup and handleVerification moved to AuthProvider scope
  const handleVerification = async () => {
    // This function can be greatly simplified since we're not handling manual verification anymore
    if (!registrationUser) {
      console.error('No user data available for verification');
      toast({
        title: "Verification Error",
        description: "No user data available for verification. Please try signing up again.",
        variant: "destructive",
      });
      return;
    }
    // Simply close the popup
    setShowVerificationPopup(false);
    setRegistrationUser(null);
  };

  const VerificationPopup = () => {
    // Auto-dismiss the popup after 7 seconds
    useEffect(() => {
      const timer = setTimeout(() => {
        setShowVerificationPopup(false);
      }, 7000);
      
      return () => clearTimeout(timer);
    }, []);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md">
          <h2 className="text-xl font-bold mb-4">Verify Your Email</h2>
          <p className="mb-4">
            We've sent a verification link to <span className="font-semibold">{registrationUser?.email}</span>.
          </p>
          <p className="mb-4">
            Please check your email and click on the verification link to complete your registration.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            This message will auto-dismiss in 7 seconds.
          </p>
          <div className="flex justify-end">
            <button
              onClick={() => {
                setShowVerificationPopup(false);
                setRegistrationUser(null);
              }}
              className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const register = async (userData: any, role: UserRole) => {
    if (!supabaseClient) throw new Error('Database connection not available');
    if (!role) throw new Error('User role is required');
    
    // Check if we're currently rate limited
    if (isRateLimited && rateLimitResetTime) {
      const timeRemaining = Math.ceil((rateLimitResetTime.getTime() - new Date().getTime()) / 60000); // minutes
      throw new Error(`Too many signup attempts. Please try again in ${timeRemaining} minute${timeRemaining !== 1 ? 's' : ''} or contact support.`);
    }
    
    setIsLoading(true);
    try {
      const newUserRole: UserRole = role;
      
      // Implement retry with exponential backoff for rate limit errors
      let retryCount = 0;
      const maxRetries = 3;
      let lastError = null;
      let signedUpUser = null; // To store the user from signUp
      
      while (retryCount <= maxRetries) {
        try {
          const { data, error: signUpError } = await supabaseClient.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: { emailRedirectTo: `${window.location.origin}/login` },
          });
          
          signedUpUser = data?.user; // Store the user from signUp
          
          // If we get here, the request succeeded
          if (signUpError) throw signUpError;
          
          // Check if user was created successfully
          if (!signedUpUser) {
            // This might be a case where the user was created in Supabase but the response wasn't properly handled
            // Let's check if we can find the user by email
            const { data: existingUserData, error: existingUserError } = await supabaseClient.auth.signInWithPassword({
              email: userData.email,
              password: userData.password,
            });
            
            if (existingUserError) {
              console.error('Error checking for existing user:', existingUserError);
              throw new Error('Failed to register user');
            }
            
            // If we can sign in, the user exists in Supabase
            if (existingUserData?.user) {
              console.log('User exists in Supabase, proceeding with profile creation');
              // Use the existing user
              signedUpUser = existingUserData.user;
              // Continue with the rest of the registration process
              lastError = null;
              break;
            } else {
              throw new Error('Failed to register user');
            }
          }
          
          // Success - proceed with the rest of the registration
          lastError = null;
          break;
        } catch (error: any) {
          lastError = error;
          
          // Only retry on rate limit errors
          if (error?.message?.includes('email rate limit exceeded') && retryCount < maxRetries) {
            retryCount++;
            const backoffTime = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s
            console.warn(`Rate limit encountered. Retry attempt ${retryCount} in ${backoffTime/1000}s`);
            await delay(backoffTime);
          } else {
            // For other errors or if we've exhausted retries, break and handle in the outer catch
            break;
          }
        }
      }
      
      // If we still have an error after retries, handle it
      if (lastError) throw lastError;
      
      // At this point, signUp was successful, or we found an existing user
      // The user object is in `signedUpUser`
      if (!signedUpUser) {
        throw new Error('Failed to obtain user details after signup/check.');
      }

      // Store userData and role for verification step
      setRegistrationUser({ ...userData, role }); 
      setShowVerificationPopup(true); // Show verification popup

      // Store the registration data in the pending_registrations table for later retrieval
      const pendingRegistrationData = {
        email: userData.email,
        role: role,
        first_name: userData.firstName || '',
        last_name: userData.lastName || '',
        company_name: userData.companyName || '',
        company_website: userData.companyWebsite || '',
        company_description: userData.companyDescription || '',
        industry: userData.industry || '',
        headline: userData.headline || '',
        bio: userData.bio || '',
        created_at: new Date().toISOString()
      };
      
      // Add the data to Supabase pending_registrations table
      const { error: pendingRegistrationError } = await supabaseClient
        .from('pending_registrations')
        .insert([pendingRegistrationData]);
        
      if (pendingRegistrationError) {
        console.error('Error storing pending registration:', pendingRegistrationError);
        // Continue anyway to show the verification popup
      }
      
      // Also store in sessionStorage as a backup
      sessionStorage.setItem('pending_registration', JSON.stringify(pendingRegistrationData));
    } catch (error: any) {
        if (error instanceof TypeError) {
            throw new Error('Network error occurred.');
        } else if (error?.message?.includes('email rate limit exceeded')) {
            console.warn(`Email rate limit exceeded for: ${userData.email}`);
            // Set rate limit flag and cooldown period (15 minutes)
            setIsRateLimited(true);
            const resetTime = new Date();
            resetTime.setMinutes(resetTime.getMinutes() + 15);
            setRateLimitResetTime(resetTime);
            // Store rate limit info in localStorage to persist across page refreshes
            localStorage.setItem('jobfinder_rate_limit', JSON.stringify({
              limited: true,
              resetTime: resetTime.toISOString()
            }));
            throw new Error('Too many signup attempts. Please try again in 15 minutes or contact support if this persists.');
        } else if (error?.message?.includes('User already registered')) {
            console.warn(`User already registered: ${userData.email}`);
            // Try to sign in the user since they already exist in Supabase
            try {
              const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
                email: userData.email,
                password: userData.password,
              });
              
              if (signInError) {
                throw new Error('User already registered. Please sign in instead.');
              }
              
              // If sign-in succeeds, the user exists in Supabase
              if (signInData?.user) {
                // Check if the user exists in our users table
                const { data: existingUserData, error: existingUserError } = await supabaseClient
                  .from('users')
                  .select('id, email, role')
                  .eq('id', signInData.user.id)
                  .single();
                
                if (!existingUserError && existingUserData) {
                  // User exists in our database, set the user and return
                  const userObj: User = {
                    id: existingUserData.id,
                    email: existingUserData.email,
                    role: existingUserData.role as UserRole,
                  };
                  
                  setUser(userObj);
                  localStorage.setItem('jobfinder_user', JSON.stringify(userObj));
                  return; // Exit the function successfully
                }
                
                // User exists in Supabase but not in our users table
                // Continue with creating the user in our database
                const currentUser = signInData.user;
                
                // Insert into users table with the requested role
                const { error: insertError } = await supabaseClient.from('users').insert([{ 
                  id: currentUser.id, 
                  email: currentUser.email, 
                  password_hash: 'verified_via_login', 
                  role: role 
                }]);
                
                if (insertError) {
                  console.error('Insert error details:', insertError);
                  throw new Error('Failed to add user to database');
                }
                
                // Create the appropriate profile
                try {
                  if (role === 'job_seeker') {
                    await createProfile(currentUser.id, userData, 'job_seeker_profiles');
                  } else if (role === 'employer') {
                    await createProfile(currentUser.id, userData, 'employer_profiles');
                  }
                } catch (profileError) {
                  console.error('Profile creation failed:', profileError);
                  // Continue with user creation even if profile creation fails
                }
                
                const newUser: User = {
                  id: currentUser.id,
                  email: currentUser.email || '',
                  role: role,
                };
                
                setUser(newUser);
                localStorage.setItem('jobfinder_user', JSON.stringify(newUser));
                return; // Exit the function successfully
              }
            } catch (signInAttemptError) {
              console.error('Error during sign-in attempt:', signInAttemptError);
              // Fall through to the original error
            }
            
            throw new Error('User already registered. Please sign in instead.');
        } else {
            console.error('Registration error:', error);
            throw new Error(error?.message || 'Failed to register user');
        }
    } finally {
      setIsLoading(false);
      };
  };

  // Effect to clear rate limit when cooldown period expires
  useEffect(() => {
    if (isRateLimited && rateLimitResetTime) {
      const timeoutId = setTimeout(() => {
        setIsRateLimited(false);
        setRateLimitResetTime(null);
        localStorage.removeItem('jobfinder_rate_limit');
      }, rateLimitResetTime.getTime() - new Date().getTime());
      
      return () => clearTimeout(timeoutId);
    }
  }, [isRateLimited, rateLimitResetTime]);

  const value = {
    user,
    isLoading,
    login,
    logout,
    register,
    isRateLimited
  }

  // Render verification popup if the flag is set
  return (
    <AuthContext.Provider value={value}>
      {children}
      {showVerificationPopup && <VerificationPopup />}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}