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

  const createProfile = async (userId: string, userData: any, profileType: 'user_profiles' | 'employer_profiles') => {
    try {
        if (!supabaseClient) throw new Error('Database connection not available');
        if(profileType === 'user_profiles'){
        const { error } = await supabaseClient
        .from('user_profiles')
        .insert([{
          user_id: userId,
          first_name: userData.firstName,
          last_name: userData.lastName,
          headline: userData.headline,
          bio: userData.bio,
        }]);
        if (error) {
            throw new Error('Database error creating profile');
        }
        }else{
        const { error } = await supabaseClient
        .from('employer_profiles')
          .insert([{
            user_id: userId,
            email: userData.email,
            role: 'employer',
            password: userData.password,
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
      const { data, error } = await supabaseClient
        .from('users')
        .select('id, email, role')
        .eq('email', email)
        .eq('encrypted_password', password)
        .single();

      if (error || !data) {
        throw new Error('Invalid email or password');
      }

      const userData: User = {
        id: data.id,
        email: data.email,
        role: data.role as UserRole
      };

      setUser(userData);
      localStorage.setItem('jobfinder_user', JSON.stringify(userData));
    } finally {
      setIsLoading(false);
    }
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
      });

      if (signUpError) {
        if (signUpError?.message === 'User already registered') {
          console.log('User already registered:', userData.email);
          return;
        } else {
          throw new Error(signUpError?.message || 'Failed to register user');
        }
      }

    if (!user) {
      throw new Error('Failed to register user');
    }
      const newUser: User = {
        id: user.id,
        email: user.email || '',
        role: newUserRole,
      };
      if(role === 'job_seeker'){
        await createProfile(newUser.id, userData, 'user_profiles');
      }else if(role === 'employer'){
        await createProfile(newUser.id, userData, 'employer_profiles');
      }else{
        throw new Error('User role not supported');

      };
      
      try {
        await createProfile(newUser.id, newUser.role, userData);
      } catch (error) {
        throw new Error((error as any)?.message || 'Failed to create user profile');
      }
      
      
      setUser(newUser);
      localStorage.setItem('jobfinder_user', JSON.stringify(newUser));
    } catch (error) {
      throw new Error((error as any)?.message || 'Failed to register user');
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