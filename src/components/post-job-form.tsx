'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabaseClient } from '@/lib/supabase/client';
import { useToast } from "@/hooks/use-toast"; // Import useToast
import { useState } from 'react';
import { Loader2 } from 'lucide-react'; // Import Loader2 for loading state

const formSchema = z.object({
  title: z.string().min(2, {
    message: 'Job title must be at least 2 characters.',
  }).max(100, { message: 'Job title must be 100 characters or less.'}),
  company_name: z.string().min(2, {
    message: 'Company name must be at least 2 characters.',
  }).max(100, { message: 'Company name must be 100 characters or less.'}),
  location: z.string().min(2, {
    message: 'Location must be at least 2 characters.',
  }).max(100, { message: 'Location must be 100 characters or less.'}),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }).max(5000, { message: 'Description must be 5000 characters or less.'}),
  application_instructions: z.string().min(10, {
    message: 'Application instructions must be at least 10 characters.',
  }).max(1000, { message: 'Application instructions must be 1000 characters or less.'}),
});

export default function PostJobForm() {
  const { toast } = useToast(); // Get toast function
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      company_name: '',
      location: '',
      description: '',
      application_instructions: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true); // Start loading
    try {
        if (!supabaseClient) {
            throw new Error('Supabase client is not initialized. Please try again.');
        }
        
        // Get the current user's ID for employer_user_id
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            throw new Error('You must be logged in to post a job.');
        }
        
        const { error } = await supabaseClient
            .from('job_postings')
            .insert([
                {
                    job_title: values.title, // Map to job_title column in DB
                    employer_user_id: user.id, // Set to the current user's ID
                    location: values.location,
                    job_description: values.description, // Map to job_description column in DB
                    application_instructions: values.application_instructions,
                },
            ]);

        if (error) {
            console.error('Supabase insert error:', error);
            throw new Error('Failed to post job. Please check console for details.');
        }

        toast({
            title: "Success!",
            description: "Your job posting has been submitted.",
            variant: "default", // Use default variant for success
        });
        form.reset(); // Reset form fields after successful submission
    } catch (err: any) {
        toast({
            title: "Error",
            description: err.message || 'An unexpected error occurred while posting the job.',
            variant: "destructive",
        });
    } finally {
       setIsSubmitting(false); // Stop loading
    }
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center text-primary">Post a New Job</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Software Engineer" {...field} aria-required="true" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Tech Corp" {...field} aria-required="true"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., New York, NY or Remote" {...field} aria-required="true"/>
                  </FormControl>
                   <FormDescription>
                      Specify the city, state, or "Remote".
                   </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the role, responsibilities, and qualifications..."
                      className="min-h-[150px]"
                      {...field}
                      aria-required="true"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="application_instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Application Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain how candidates should apply (e.g., link to application portal, email address)."
                      className="min-h-[100px]"
                      {...field}
                      aria-required="true"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Post Job'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
