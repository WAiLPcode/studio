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

export function AuthProvider({ children }: { children: ReactNode }) {
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
    // For this prototype, we'll check localStorage
    const storedUser = localStorage.getItem('jobfinder_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('jobfinder_user');
      }
    }
    
    // Check for stored rate limit information
    const storedRateLimit = localStorage.getItem('jobfinder_rate_limit');
    if (storedRateLimit) {
      try {
        const rateLimitData = JSON.parse(storedRateLimit);
        if (rateLimitData.limited) {
          const resetTime = new Date(rateLimitData.resetTime);
          // If the reset time is in the future, maintain the rate limit
          if (resetTime > new Date()) {
            setIsRateLimited(true);
            setRateLimitResetTime(resetTime);
          } else {
            // Reset rate limit if cooldown period has passed
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
    if (!registrationUser) {
      console.error('No user data available for verification');
      toast({
        title: "Verification Error",
        description: "No user data available for verification. Please try signing up again.",
        variant: "destructive",
      });
      return;
    }
    try {
      if (!supabaseClient) {
          toast({
            title: "Database Error",
            description: "Database connection not available. Please try again later.",
            variant: "destructive",
          });
          throw new Error('Database connection not available');
      }
      const { error: verifyError } = await supabaseClient.auth.verifyOtp({
        email: registrationUser.email, // Use email from stored registrationUser
        token: verificationCode,
        type: 'signup'
      });

      if (verifyError) {
        // The catch block will handle toasting this error
        throw verifyError;
      }

      // Get the verified user from Supabase auth
      const { data: { user: verifiedUser } } = await supabaseClient.auth.getUser();

      if (!verifiedUser) {
        throw new Error('Verification successful, but failed to retrieve user details.');
      }

      // Insert user data into the 'users' table now that email is verified
      const { error: insertError } = await supabaseClient.from('users').insert([{
        id: verifiedUser.id,
        email: verifiedUser.email, // Use the email from the verified Supabase user
        password_hash: registrationUser.password, // As per original comment, this was the previous behavior
        role: registrationUser.role,
        first_name: registrationUser.firstName,
        last_name: registrationUser.lastName,
        company_name: registrationUser.companyName,
        company_website: registrationUser.companyWebsite,
        company_description: registrationUser.companyDescription,
        industry: registrationUser.industry
      }]);

      if (insertError) {
        console.error('Insert error details into users table:', insertError);
        throw new Error(`Failed to save user details: ${insertError.message}`);
      }

      // Create user profile after successful verification
      const role = registrationUser.role as UserRole;
      // Consolidate all data for profile creation, ensuring verified email is used
      const profileDataForCreation = { 
        ...registrationUser, 
        email: verifiedUser.email 
      };

      if (role === 'employer') {
        await createProfile(verifiedUser.id, profileDataForCreation, 'employer_profiles');
      } else if (role === 'job_seeker') {
        await createProfile(verifiedUser.id, profileDataForCreation, 'job_seeker_profiles');
      } else {
        console.error(`Unsupported role for profile creation: ${role}`);
        throw new Error('User role not supported for profile creation.');
      }

      // Update the main user state in AuthContext
      const newUser: User = {
        id: verifiedUser.id,
        email: verifiedUser.email || '', // Ensure email is not null
        role: role,
      };
      setUser(newUser);
      localStorage.setItem('jobfinder_user', JSON.stringify(newUser));

      setShowVerificationPopup(false);
      setVerificationCode(''); // Clear verification code
      setRegistrationUser(null); // Clear temporary registration data

      toast({
        title: "Account Verified",
        description: "Your account has been successfully verified and your profile created.",
        variant: "default",
      });

    } catch (error: any) {
      console.error('Verification process failed:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "An unexpected error occurred during verification. Please try again.",
        variant: "destructive",
      });
      throw error; // Re-throw error to allow calling components to handle if needed
    }
  };

  const VerificationPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <h2 className="text-xl font-bold mb-4">Email Verification</h2>
        <p className="mb-4">Please enter the verification code sent to {registrationUser?.email || 'your email'}</p>
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          className="border p-2 w-full mb-4"
          placeholder="Verification code"
        />
        <div className="flex justify-end">
          <button
            onClick={() => {
              setShowVerificationPopup(false);
              setVerificationCode(''); // Clear code if popup is closed manually
              // Optionally, clear registrationUser if abandoning verification
            }}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 mr-2"
          >
            Cancel
          </button>
          <button
            onClick={handleVerification}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Verify
          </button>
        </div>
      </div>
    </div>
  );

  const register = async (userData: any, role: UserRole) => {
    if (!supabaseClient) throw new Error('Database connection not available');
    if (!role) throw new Error('User role is required');
    // Removed useState calls for currentUser, verificationCode, showVerificationPopup
    // Removed VerificationPopup and handleVerification definitions from here

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

      // The rest of the logic (inserting into 'users' table, creating profile, setUser)
      // will now happen inside `handleVerification` after OTP is confirmed.
      // We don't set the user in AuthContext immediately after signUp anymore.
      // We wait for email verification.

      // User insertion into 'users' table moved to handleVerification.
        
      // No longer setting user here, it will be set after verification
      // setUser(newUser);
      // localStorage.setItem('jobfinder_user', JSON.stringify(newUser));
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
                
                // Insert into users table
                const { error: insertError } = await supabaseClient.from('users').insert([{ 
                  id: currentUser.id, 
                  email: currentUser.email, 
                  password_hash: userData.password || '', // Added default for password_hash as well, though its direct storage is questionable
                  role: role, 
                  first_name: userData.firstName || '', 
                  last_name: userData.lastName || '', 
                  company_name: userData.companyName || '', 
                  company_website: userData.companyWebsite || '', 
                  company_description: userData.companyDescription || '', 
                  industry: userData.industry || '' 
                }]);
                
                if (insertError) {
                  console.error('Insert error details:', insertError);
                  throw new Error('Failed to add user to table');
                }
                
                // Create profile
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}