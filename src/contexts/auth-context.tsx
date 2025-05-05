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
      
      if (signUpError || !user) {
          throw new Error(signUpError?.message || 'Failed to register user');
      }

      const newUser: User = {
        id: user.id,
        email: user.email || '',
        role: newUserRole,
      };
      setUser(newUser);
      localStorage.setItem('jobfinder_user', JSON.stringify(newUser));
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error((error as any)?.message || 'An unexpected error occurred during registration.');
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