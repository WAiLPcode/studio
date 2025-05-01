'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

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
  const supabase = getSupabaseBrowserClient();

  // Check for existing user session on mount
  useEffect(() => {
    // In a real app, this would check for an existing session token
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

  // Login function
  const login = async (email: string, password: string) => {
    if (!supabase) throw new Error('Database connection not available');
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('email', email)
        .eq('encrypted_password', password) // Note: In a real app, this would use proper password hashing
        .single();

      if (error || !data) {
        throw new Error('Invalid email or password');
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
    // Clear user from state and localStorage
    setUser(null);
    localStorage.removeItem('jobfinder_user');
  };

  // Register function
  const register = async (userData: any, role: UserRole) => {
    if (!supabase) throw new Error('Database connection not available');
    if (!role) throw new Error('User role is required');
    
    setIsLoading(true);
    try {
      // Insert into users table
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            email: userData.email,
            encrypted_password: userData.password, // Note: In a real app, this would be hashed
            role: role
          }
        ])
        .select('id, email, role')
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Failed to register user');
      }

      // Insert profile data based on role
      if (role === 'job_seeker') {
        const { error: profileError } = await supabase
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

        if (profileError) throw new Error(profileError.message);
      } else if (role === 'employer') {
        const { error: profileError } = await supabase
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

        if (profileError) throw new Error(profileError.message);
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