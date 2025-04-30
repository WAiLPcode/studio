'use client';
import * as React from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'] as const;
const experienceLevels = ['Entry-level', 'Mid-level', 'Senior-level'] as const;
const salaryCurrencies = ['USD', 'EUR'] as const;



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
  employment_type: z.enum(employmentTypes, {
    required_error: 'Please select an employment type.'
  }),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
  salary_currency: z.enum(salaryCurrencies).default('USD'),
  experience_level: z.enum(experienceLevels, { required_error: 'Please select an experience level.' }),
  expires_at: z.date({ required_error: 'Please select an expiration date.' }),
});

export default function PostJobForm() {
  const supabase = getSupabaseBrowserClient();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

    if (!supabase) {
        return (
            <div className="max-w-3xl mx-auto space-y-4">
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Supabase client is not initialized. Please make sure the code is running in a browser environment.</AlertDescription>
                </Alert>
            </div>
        );
    }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      company_name: '',
      location: '',
      description: '',
      application_instructions: '',
      employment_type: employmentTypes[0],
      salary_min: "",
      salary_max: "",
      salary_currency: salaryCurrencies[0],
      experience_level: experienceLevels[0],
      expires_at: new Date(),
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    if (!supabase) {
        toast({
            title: "Error",
            description: 'Supabase client is not initialized. Please make sure the code is running in a browser environment.',
            variant: "destructive",
        });
        setIsSubmitting(false);
        return;
    }
    try {
        const { error } = await supabase
            .from('job_postings')
            .insert([
                {
                    title: values.title,
                    company_name: values.company_name,
                    location: values.location,
                    description: values.description,
                    application_instructions: values.application_instructions,
                    employment_type: values.employment_type,
                    salary_min: values.salary_min,
                    salary_max: values.salary_max,
                    salary_currency: values.salary_currency,
                    experience_level: values.experience_level,
                    expires_at: values.expires_at,
                },
            ]);

        if (error) {
            console.error('Supabase insert error:', error);
            toast({
              title: "Error",
              description: 'Failed to post job. Please check console for details.',
              variant: "destructive",
            });
             setIsSubmitting(false);
             return;
        }

        toast({
            title: "Success!",
            description: "Your job posting has been submitted.",
            variant: "default",
        });
        form.reset();
    } catch (err: any) {
        toast({
            title: "Error",
            description: err.message || 'An unexpected error occurred while posting the job.',
            variant: "destructive",
        });
    } finally {
       setIsSubmitting(false);
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
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name="employment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employment Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                         {employmentTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="experience_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {experienceLevels.map((level) => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <FormField
                control={form.control}
                name="salary_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary Min</FormLabel>
                    <FormControl>
                      <Input type='number' placeholder="e.g., 50000" {...field} value={field.value} onChange={field.onChange}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salary_max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary Max</FormLabel>
                    <FormControl>
                      <Input type='number' placeholder="e.g., 100000" {...field} value={field.value} onChange={field.onChange}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="salary_currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {salaryCurrencies.map((currency) => (
                          <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
              control={form.control}
              name="expires_at"
              render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expires At</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button variant={"outline"} className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
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