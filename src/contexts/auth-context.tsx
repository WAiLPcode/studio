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
    setIsLoading(false);
  }, []);

  const createProfile = async (userId: string, userData: any, profileType: 'user_profiles' | 'employer_profiles' ) => {
    try {
        if (!supabaseClient) throw new Error('Database connection not available');
        if(profileType === 'user_profiles'){
        const { error } = await supabaseClient
        .from('user_profiles')
        .insert([{
          user_id: userId,
          first_name: userData.firstName,
          headline: userData.headline,
          bio: userData.bio,
        }]);
        if (error) throw new Error('Database error creating profile');
        }else{
        const { error } = await supabaseClient
        .from('employer_profiles')
          .insert([{
            user_id: userId,
            first_name: userData.firstName,
            last_name: userData.lastName,
           
            company_bio: userData.companyDescription,
            
            company_name: userData.companyName,            
            company_website: userData.companyWebsite,
            company_description: userData.companyDescription,
            industry: userData.industry,
          }]);
        if (error) throw new Error('Database error creating profile');
      }
    } catch (error) {
      throw new Error((error as any)?.message || 'Database error creating profile');


    }
  }
  const login = async (email: string, password: string) => {
    if (!supabaseClient) throw new Error('Database connection not available');
    
    setIsLoading(true);
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error || !data?.user) {
        throw new Error('Invalid email or password');
      }

      const userData: User = {
        id: data.user?.id || '',
        email: data.user?.email || '',
        role: null,
      };

      setUser(userData);
      localStorage.setItem('jobfinder_user', JSON.stringify(userData));
    }catch(error){
        throw new Error((error as any)?.message || 'Failed to login user');
    }finally {
      setIsLoading(false);
    };
  };
  const logout = async () => {
    setUser(null);
    localStorage.removeItem('jobfinder_user');
  };
  const register = async (userData: any, role: UserRole) => {
    if (!supabaseClient) throw new Error('Database connection not available');
    if (!role) throw new Error('User role is required');
    
     setIsLoading(true);
    try {
      const newUserRole: UserRole = role;
      const { data: { user }, error: signUpError } = await supabaseClient.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
       if (signUpError) {
          if(signUpError.message){
            if (signUpError.message.includes('User already registered')) {
                // Handle 'User already registered' specifically if needed
                console.warn(`User already registered: ${userData.email}`);
                throw new Error('User already registered');
            } else {
              
                throw new Error(signUpError?.message || 'Failed to register user');
            }
          }
      }
      if (!user) {
      throw new Error('Failed to register user');
    }
      const { error: insertError } = await supabaseClient.from('users').insert([{ id: user.id, email: user.email, role: role, encrypted_password: userData.password }]);
        if (insertError) {
            throw new Error('Failed to add user to table');
    }
        const newUser: User = {
            id: user.id,
            email: user.email || '',
            role: newUserRole,
        };
        if (role === 'job_seeker') {
            await createProfile(newUser.id, userData, 'user_profiles');
        } else if (role === 'employer') {
            console.log('userData', userData);
            await createProfile(newUser.id, userData, 'employer_profiles');
        } else {
            throw new Error('User role not supported');
        }
      
      
        setUser(newUser);
        localStorage.setItem('jobfinder_user', JSON.stringify(newUser));
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error('Network error occurred.');
          } else {
            throw new Error((error as any)?.message || 'Failed to register user');
          }
      
    } finally {
      setIsLoading(false);
      };
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    register
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