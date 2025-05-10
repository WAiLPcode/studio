"use client";
import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { useForm, FieldValues, Control } from 'react-hook-form';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
  FormControl
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';

interface JobSeekerProfileFormProps {
  
}

const JobSeekerProfileForm: React.FC<JobSeekerProfileFormProps> = () : ReactNode => {
  const { user } = useAuth();
   const [formData, setFormData] = useState({

    firstName: '',
    lastName: '',
    email: '',
    professionalHeadline: '',
    bio: '',
    phoneNumber: '',
    profilePictureUrl: '',
    resumeUrl: '',
    websiteUrl: '',
    linkedinUrl: '',
    githubUrl: '',
  });

  const form = useForm<FieldValues>({
    defaultValues: {
    },
  });

  const { control } = form;

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState('')

  const fetchProfileData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/profile/job-seeker?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setFormData(data);
      } else {
        // If no data exist for the user, set the form to empty values
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          professionalHeadline: '',
          bio: '',
          phoneNumber: '',
          profilePictureUrl: '',
          resumeUrl: '',
          websiteUrl: '',
          linkedinUrl: '',
          githubUrl: '',
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

    if (!user) {
      setError(true);
      setMessage('User not authenticated');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/profile/job-seeker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, userId: user.id }),
      } as RequestInit);

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
  }, [formData, user?.id]);

  return (
    isLoading ? <p>Loading...</p> :
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="firstName" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="First Name" {...field} name="firstName" value={formData.firstName} onChange={handleChange}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          <FormField
            control={control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Last Name" {...field} name="lastName" value={formData.lastName} onChange={handleChange}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Email" {...field} name="email" value={formData.email} onChange={handleChange}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="professionalHeadline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Professional Headline</FormLabel>
              <FormControl>
                <Input placeholder="Professional Headline" {...field} name="professionalHeadline" value={formData.professionalHeadline} onChange={handleChange}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Input placeholder="Bio" {...field} name="bio" value={formData.bio} onChange={handleChange}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="Phone Number" {...field} name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="profilePictureUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile Picture URL</FormLabel>
              <FormControl>
                <Input placeholder="Profile Picture URL" {...field} name="profilePictureUrl" value={formData.profilePictureUrl} onChange={handleChange}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="resumeUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resume URL</FormLabel>
              <FormControl>
                <Input placeholder="Resume URL" {...field} name="resumeUrl" value={formData.resumeUrl} onChange={handleChange}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="websiteUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website URL</FormLabel>
              <FormControl>
                <Input placeholder="Website URL" {...field} name="websiteUrl" value={formData.websiteUrl} onChange={handleChange}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="linkedinUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>LinkedIn URL</FormLabel>
              <FormControl>
                <Input placeholder="LinkedIn URL" {...field} name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="githubUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>GitHub URL</FormLabel>
              <FormControl>
                <Input placeholder="GitHub URL" {...field} name="githubUrl" value={formData.githubUrl} onChange={handleChange}/>
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
        <p>Form Data: {JSON.stringify(formData,null,2)}</p>
        </div>
      </form>
    </Form>
  );
};

export default JobSeekerProfileForm;