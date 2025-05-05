"use client";

import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { useForm, FieldValues, Control, UseFormReturn } from 'react-hook-form';
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { FormLabel } from '@/components/ui/form';

interface EmployerProfileFormProps {

}

const EmployerProfileForm: React.FC<EmployerProfileFormProps> = () : ReactNode => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState('');
    const defaultValues: FieldValues = {
    companyName: '',
    email: '',
    companyWebsite: '',
    industry: '',
    companyDescription: '',
    companyLogoUrl: '',
    companySize: '',
  };

  const { user, isLoading: isUserLoading } = useAuth();
  
    
  
  
    const form = useForm<FieldValues>({
    
    
    
    mode: 'onChange',
    reValidateMode: 'onChange',
    criteriaMode: 'firstError',
    shouldFocusError: true,
    shouldUnregister: false,
    shouldUseNativeValidation: false,
    defaultValues: defaultValues,
  });
  const { control } = form;

  const fetchProfileData = async () => {
    if (!user?.id || isUserLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/profile/employer?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        if(Object.values(data).some(value => value !== '')){
          form.reset(data);
        }else {
          form.setValue('email', user.email ?? '');
        }
      } else {
        // If no data exist for the user, set the form to empty values
        form.setValue('email', user.email ?? '');
        console.error('Error fetching profile data:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {fetchProfileData();}, [user]);

  const handleSubmit = form.handleSubmit(async (data) => {
    if(!user) return;
    setIsSubmitting(true);
    setError(false);
    setMessage('');
    try {
        const response = await fetch('/api/profile/employer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, userId: user.id }),
      });

      if (response.ok) {
        console.log('Profile updated successfully!');
      } else {
        const errorData = await response.json();
        console.error('Error updating profile:', errorData);
        setError(true);
        setMessage(errorData.error || 'Error updating profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(true);
      setMessage('An unexpected error occurred while updating the profile');
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    isLoading ? <p>Loading...</p> :
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            control={control}
            name="companyName"
            render={({ field }) => (
              <FormItem className='space-y-2'>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input placeholder="Company Name" {...field} name="companyName"  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormItem className='space-y-2'>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Email" {...field} name="email"  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="companyWebsite"
            render={({ field }) => (
              <FormItem className='space-y-2'>
                <FormLabel>Company Website</FormLabel>
                <FormControl>
                  <Input placeholder="Company Website" {...field} name="companyWebsite" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="industry"
            render={({ field }) => (
              <FormItem className='space-y-2'>
                <FormLabel>Industry</FormLabel>
                <FormControl>
                  <Input placeholder="Industry" {...field} name="industry" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="companyDescription"
            render={({ field }) => (
              <FormItem className='space-y-2'>
                <FormLabel>Company Description</FormLabel>
                <FormControl>
                  <Input placeholder="Company Description" {...field} name="companyDescription" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="companyLogoUrl"
            render={({ field }) => (
              <FormItem className='space-y-2'>
                <FormLabel>Company Logo URL</FormLabel>
                <FormControl>
                  <Input placeholder="Company Logo URL" {...field} name="companyLogoUrl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="companySize"
            render={({ field }) => (
              <FormItem className='space-y-2'>
                <FormLabel>Company Size</FormLabel>
                <FormControl>
                  <Input placeholder="Company Size" {...field} name="companySize" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
            {error && <p className='text-red-500'>{message}</p>}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
          </div>
        </form>
      </Form>
  );
};

export default EmployerProfileForm;