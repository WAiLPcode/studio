'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { supabaseClient } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Building2, User } from 'lucide-react';

// Job Seeker Profile Schema
const jobSeekerProfileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone_number: z.string().optional(),
  headline: z.string().optional(),
  bio: z.string().optional(),
  website_url: z.string().url().optional().or(z.literal('')),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  github_url: z.string().url().optional().or(z.literal('')),
  // File uploads will be handled separately
});

// Employer Profile Schema
const employerProfileSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  company_website: z.string().url().optional().or(z.literal('')),
  company_description: z.string().optional(),
  industry: z.string().optional(),
  company_size: z.string().optional(),
  // File uploads will be handled separately
});

type JobSeekerProfileFormValues = z.infer<typeof jobSeekerProfileSchema>;
type EmployerProfileFormValues = z.infer<typeof employerProfileSchema>;

export function ProfileUpdateModal() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [resume, setResume] = useState<File | null>(null);
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  
  // Job Seeker Form
  const jobSeekerForm = useForm<JobSeekerProfileFormValues>({
    resolver: zodResolver(jobSeekerProfileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone_number: '',
      headline: '',
      bio: '',
      website_url: '',
      linkedin_url: '',
      github_url: '',
    },
  });

  // Employer Form
  const employerForm = useForm<EmployerProfileFormValues>({
    resolver: zodResolver(employerProfileSchema),
    defaultValues: {
      company_name: '',
      company_website: '',
      company_description: '',
      industry: '',
      company_size: '',
    },
  });

  // Fetch user profile data when modal opens
  useEffect(() => {
    if (open && user) {
      fetchUserProfile();
    }
  }, [open, user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      if (user.role === 'job_seeker') {
        if (!supabaseClient) {
          throw new Error('Supabase client is not initialized');
        }
        const { data, error } = await supabaseClient
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        if (data) {
          jobSeekerForm.reset({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            phone_number: data.phone_number || '',
            headline: data.headline || '',
            bio: data.bio || '',
            website_url: data.website_url || '',
            linkedin_url: data.linkedin_url || '',
            github_url: data.github_url || '',
          });
        }
      } else if (user.role === 'employer') {
        if (!supabaseClient) {
          throw new Error('Supabase client is not initialized');
        }
        const { data, error } = await supabaseClient
          .from('employer_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        if (data) {
          employerForm.reset({
            company_name: data.company_name || '',
            company_website: data.company_website || '',
            company_description: data.company_description || '',
            industry: data.industry || '',
            company_size: data.company_size || '',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file uploads
  const uploadFile = async (file: File, bucket: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    if (!supabaseClient) {
      throw new Error('Supabase client is not initialized');
    }
    
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(filePath, file, {
        upsert: true,
      });

    if (error) throw error;
    
    // Get public URL
    if (!supabaseClient) {
      throw new Error('Supabase client is not initialized');
    }
    
    const { data: urlData } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  // Handle job seeker profile update
  const onJobSeekerSubmit = async (values: JobSeekerProfileFormValues) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Handle file uploads if files were selected
      let profilePictureUrl;
      let resumeUrl;

      if (profilePicture) {
        profilePictureUrl = await uploadFile(profilePicture, 'profile-pictures');
      }

      if (resume) {
        resumeUrl = await uploadFile(resume, 'resumes');
      }

      // Update profile in database
      if (!supabaseClient) {
        throw new Error('Supabase client is not initialized');
      }
      
      const { error } = await supabaseClient
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          ...values,
          profile_picture_url: profilePictureUrl || undefined,
          resume_url: resumeUrl || undefined,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Your profile has been updated',
      });

      setOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle employer profile update
  const onEmployerSubmit = async (values: EmployerProfileFormValues) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Handle file upload if a file was selected
      let companyLogoUrl;

      if (companyLogo) {
        companyLogoUrl = await uploadFile(companyLogo, 'company-logos');
      }

      // Update profile in database
      if (!supabaseClient) {
        throw new Error('Supabase client is not initialized');
      }
      
      const { error } = await supabaseClient
        .from('employer_profiles')
        .upsert({
          user_id: user.id,
          ...values,
          company_logo_url: companyLogoUrl || undefined,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Your company profile has been updated',
      });

      setOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file input changes
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePicture(e.target.files[0]);
    }
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResume(e.target.files[0]);
    }
  };

  const handleCompanyLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCompanyLogo(e.target.files[0]);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="flex items-center gap-1 hover:bg-secondary"
        >
          {user.role === 'employer' ? (
            <>
              <Building2 className="h-4 w-4 mr-1" />
              <span>Employer</span>
            </>
          ) : (
            <>
              <User className="h-4 w-4 mr-1" />
              <span>Job Seeker</span>
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {user.role === 'job_seeker' ? 'Update Your Profile' : 'Update Company Profile'}
          </DialogTitle>
          <DialogDescription>
            {user.role === 'job_seeker' 
              ? 'Update your personal information and job preferences.'
              : 'Update your company information and details.'}
          </DialogDescription>
        </DialogHeader>

        {user.role === 'job_seeker' ? (
          <Form {...jobSeekerForm}>
            <form onSubmit={jobSeekerForm.handleSubmit(onJobSeekerSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={jobSeekerForm.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={jobSeekerForm.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={jobSeekerForm.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={jobSeekerForm.control}
                name="headline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Headline</FormLabel>
                    <FormControl>
                      <Input placeholder="Full Stack Developer | React, Node.js" {...field} />
                    </FormControl>
                    <FormDescription>
                      A brief professional title or summary that appears under your name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={jobSeekerForm.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell employers about yourself, your skills, and experience..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormField
                  control={jobSeekerForm.control}
                  name="website_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://yourwebsite.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={jobSeekerForm.control}
                  name="linkedin_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://linkedin.com/in/yourprofile" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={jobSeekerForm.control}
                  name="github_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GitHub URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://github.com/yourusername" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <FormLabel htmlFor="profile_picture">Profile Picture</FormLabel>
                  <Input 
                    id="profile_picture"
                    type="file" 
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="mt-1"
                  />
                  <FormDescription>
                    Upload a professional photo of yourself.
                  </FormDescription>
                </div>

                <div>
                  <FormLabel htmlFor="resume">Resume</FormLabel>
                  <Input 
                    id="resume"
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeChange}
                    className="mt-1"
                  />
                  <FormDescription>
                    Upload your resume (PDF, DOC, or DOCX).
                  </FormDescription>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Profile'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...employerForm}>
            <form onSubmit={employerForm.handleSubmit(onEmployerSubmit)} className="space-y-4">
              <FormField
                control={employerForm.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={employerForm.control}
                name="company_website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://yourcompany.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={employerForm.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Input placeholder="Technology, Healthcare, Finance, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={employerForm.control}
                name="company_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Size</FormLabel>
                    <FormControl>
                      <Input placeholder="1-10, 11-50, 51-200, 201-500, 500+" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={employerForm.control}
                name="company_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell job seekers about your company, culture, and mission..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel htmlFor="company_logo">Company Logo</FormLabel>
                <Input 
                  id="company_logo"
                  type="file" 
                  accept="image/*"
                  onChange={handleCompanyLogoChange}
                  className="mt-1"
                />
                <FormDescription>
                  Upload your company logo.
                </FormDescription>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Company Profile'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}