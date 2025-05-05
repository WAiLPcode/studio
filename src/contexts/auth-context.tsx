'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabaseClient } from '@/lib/supabase/client';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Use the imported supabaseClient directly

  // Check for existing user session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        if (!supabaseClient) {
          console.error('Supabase client not initialized');
          setIsLoading(false);
          return;
        }
        // Check for an existing Supabase session
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (session?.user) {
          // Get user data from the users table
          const { data, error: userError } = await supabaseClient
            .from('users')
            .select('id, email, role')
            .eq('id', session.user.id)
            .single();
            
          if (data && !userError) {
            const userData: User = {
              id: data.id,
              email: data.email,
              role: data.role as UserRole
            };
            
            setUser(userData);
            localStorage.setItem('jobfinder_user', JSON.stringify(userData));
          } else {
            // If we can't get user data, sign out
            await supabaseClient.auth.signOut();
            localStorage.removeItem('jobfinder_user');
          }
        } else {
          // No session, check localStorage as fallback
          const storedUser = localStorage.getItem('jobfinder_user');
          if (storedUser) {
            try {
              // Verify the stored user with a session check
              const userData = JSON.parse(storedUser);
              // If no active session but localStorage data exists, clear it
              localStorage.removeItem('jobfinder_user');
            } catch (error) {
              console.error('Failed to parse stored user:', error);
              localStorage.removeItem('jobfinder_user');
            }
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
        localStorage.removeItem('jobfinder_user');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    if (!supabaseClient) throw new Error('Database connection not available');
    
    setIsLoading(true);
    try {
      // First, use Supabase's auth.signInWithPassword method
      const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        throw new Error(authError.message || 'Invalid email or password');
      }

      if (!authData.user) {
        throw new Error('No user data returned from authentication');
      }

      // Now get the user's role from the users table
      const { data, error } = await supabaseClient!
        .from('users')
        .select('id, email, role')
        .eq('id', authData.user.id)
        .single();

      if (error || !data) {
        // If we can't get the role, sign out and throw error
        await supabaseClient!.auth.signOut();
        throw new Error('Failed to retrieve user data');
      }

      const userData: User = {
        id: data.id,
        email: data.email,
        role: data.role as UserRole
      };

      // Save user to state and localStorage
      setUser(userData);
      localStorage.setItem('jobfinder_user', JSON.stringify(userData));
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    if (!supabaseClient) throw new Error('Database connection not available');
    
    try {
      // Sign out from Supabase Auth
      await supabaseClient.auth.signOut();
      
      // Clear user from state and localStorage
      setUser(null);
      localStorage.removeItem('jobfinder_user');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear local state even if the server logout fails
      setUser(null);
      localStorage.removeItem('jobfinder_user');
    }
  };

  // Register function
  const register = async (userData: any, role: UserRole) => {
    if (!supabaseClient) throw new Error('Database connection not available');
    if (!role) throw new Error('User role is required');
    
    setIsLoading(true);
    try {
      // First, create the user in Supabase Auth
      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            role: role // Store role in user metadata
          }
        }
      });

      if (authError) {
        console.error('Authentication error during registration:', authError);
        throw new Error(authError.message || 'Failed to register user');
      }

      if (!authData.user) {
        throw new Error('No user data returned from registration');
      }

      // Insert into users table with the auth user's ID
      const { data, error } = await supabaseClient
        .from('users')
        .insert([
          {
            id: authData.user.id, // Use the ID from auth
            email: userData.email,
            role: role
          }
        ])
        .select('id, email, role')
        .single();

      if (error) {
        console.error('Registration error details:', error);
        // Try to clean up the auth user if the database insert fails
        await supabaseClient!.auth.admin.deleteUser(authData.user.id).catch(e => 
          console.error('Failed to clean up auth user after error:', e)
        );
        throw new Error(error?.message || 'Failed to register user');
      }
      
      if (!data) {
        throw new Error('No data returned from registration');
      }

      // Insert profile data based on role
      if (role === 'job_seeker') {
        // We've already checked supabaseClient at the beginning of this function
        const { error: profileError } = await supabaseClient!
          .from('user_profiles')
          .insert([
            {
              user_id: data.id,
              first_name: userData.firstName,
              last_name: userData.lastName,
              headline: userData.headline || null,
              bio: userData.bio || null
            }
          ]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error(profileError.message);
        }
      } else if (role === 'employer') {
        // We've already checked supabaseClient at the beginning of this function
        const { error: profileError } = await supabaseClient!
          .from('employer_profiles')
          .insert([
            {
              user_id: data.id,
              company_name: userData.companyName,
              company_website: userData.companyWebsite || null,
              company_description: userData.companyDescription || null,
              industry: userData.industry || null
            }
          ]);

        if (profileError) {
          console.error('Employer profile creation error:', profileError);
          throw new Error(profileError.message);
        }
      }

      // Log the user in after successful registration
      const newUser: User = {
        id: data.id,
        email: data.email,
        role: data.role as UserRole
      };

      setUser(newUser);
      localStorage.setItem('jobfinder_user', JSON.stringify(newUser));
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    register
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}