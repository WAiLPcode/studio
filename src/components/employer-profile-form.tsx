import React, { useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { useForm, FieldValues, Control, UseFormReturn } from 'react-hook-form';
import { useRouter } from 'next/navigation';
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
  const [formData, setFormData] = useState({
     companyName: '',
    email: '',
    companyWebsite: '',
    industry: '',
    companyDescription: '',
    companyLogoUrl: '',
    companySize: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState('');

  const { user } = useAuth();
  const router = useRouter();
  const currentPath = useMemo(() => router.asPath, [router.asPath]);

  const isEmployerProfile = currentPath.includes('/employer-profile');

  const form = useForm<FieldValues>({
    defaultValues: {
    },
  });
  const { control } = form;
  
  
  const fetchProfileData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/profile/employer?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setFormData(data);
      } else {
        // If no data exist for the user, set the form to empty values
        setFormData({
          companyName: '',
          email: '',
          companyWebsite: '',
          industry: '',
          companyDescription: '',
          companyLogoUrl: '',
          companySize: '',
        });
        console.error('Error fetching profile data:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {fetchProfileData();}, [user]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(false);
    setMessage('');
    try {
        const apiEndpoint = isEmployerProfile ? '/api/profile/employer' : '/api/profile/job-seeker';
        
        const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, userId: user.id }),
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
  }, [formData, user?.id, isEmployerProfile]);

  return (
    isLoading ? <p>Loading...</p> :
    <Form>
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField
          control={control}
          name="companyName"          
          render={({ field }) => (
            <FormItem className='space-y-2'>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Company Name" {...field} name="companyName" value={formData.companyName} onChange={handleChange} />
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
                <Input placeholder="Email" {...field} name="email" value={formData.email} onChange={handleChange} />
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
                <Input placeholder="Company Website" {...field} name="companyWebsite" value={formData.companyWebsite} onChange={handleChange} />
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
                <Input placeholder="Industry" {...field} name="industry" value={formData.industry} onChange={handleChange} />
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
                <Input placeholder="Company Description" {...field} name="companyDescription" value={formData.companyDescription} onChange={handleChange} />
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
                <Input placeholder="Company Logo URL" {...field} name="companyLogoUrl" value={formData.companyLogoUrl} onChange={handleChange} />
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
                <Input placeholder="Company Size" {...field} name="companySize" value={formData.companySize} onChange={handleChange} />
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
        <div>
          <p>Form Data: {JSON.stringify(formData)}</p>
        </div>
      </form>
    </Form>
  );
};

export default EmployerProfileForm;