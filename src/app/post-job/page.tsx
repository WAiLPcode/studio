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
import { Button as CalendarButton } from "@/components/ui/button" // Renamed Button import
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
   // Accept string input, transform to number or null, refine for positive values
  salary_min: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ invalid_type_error: "Must be a number" }).positive({ message: "Must be positive" }).optional()
  ),
  salary_max: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ invalid_type_error: "Must be a number" }).positive({ message: "Must be positive" }).optional()
  ),
  salary_currency: z.enum(salaryCurrencies).default('USD'),
  experience_level: z.enum(experienceLevels, { required_error: 'Please select an experience level.' }),
  expires_at: z.date({ required_error: 'Please select an expiration date.' }).optional(), // Made optional for testing initial state
}).refine(data => {
    // If both min and max salary are provided, max must be greater than or equal to min
    if (data.salary_min !== undefined && data.salary_max !== undefined) {
        return data.salary_max >= data.salary_min;
    }
    return true; // Validation passes if one or both are missing
}, {
    message: "Maximum salary must be greater than or equal to minimum salary",
    path: ["salary_max"], // Assign error to the max field
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
                    <AlertDescription>Supabase client is not initialized. Please check your environment variables and ensure the code is running in a browser.</AlertDescription>
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
      // Provide default enum values to avoid uncontrolled -> controlled switch for selects
      employment_type: undefined, // Let placeholder show
      salary_min: undefined, // Start as undefined
      salary_max: undefined, // Start as undefined
      salary_currency: salaryCurrencies[0], // Default currency
      experience_level: undefined, // Let placeholder show
      expires_at: undefined, // Start as undefined
    },
     mode: 'onBlur', // Validate on blur to catch salary range error
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    if (!supabase) {
        toast({
            title: "Error",
            description: 'Supabase client is not initialized.',
            variant: "destructive",
        });
        setIsSubmitting(false);
        return;
    }
    try {
        // Ensure salary fields are numbers or null before sending
        const dataToInsert = {
            ...values,
            salary_min: values.salary_min ?? null, // Convert undefined to null for DB
            salary_max: values.salary_max ?? null, // Convert undefined to null for DB
            expires_at: values.expires_at?.toISOString() ?? null, // Convert Date to ISO string or null
        };

        console.log("Submitting values:", dataToInsert); // Log data being sent


        const { error } = await supabase
            .from('job_postings')
            .insert([dataToInsert]);

        if (error) {
            console.error('Supabase insert error:', error);
            toast({
              title: "Error Posting Job",
              description: `Failed to post job: ${error.message}. Please try again.`,
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
        form.reset(); // Reset form to default values
    } catch (err: any) {
         console.error('Submit error:', err);
        toast({
            title: "Submission Error",
            description: err.message || 'An unexpected error occurred while posting the job.',
            variant: "destructive",
        });
    } finally {
       setIsSubmitting(false);
    }
  }

  // Log form state changes for debugging
  React.useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      // console.log("Form changed:", value, name, type);
       // console.log("Form errors:", form.formState.errors);
    });
    return () => subscription.unsubscribe();
  }, [form]);


  return (
    <Card className="max-w-2xl mx-auto shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center text-primary">Post a New Job</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, (errors) => console.log("Form validation errors:", errors))} className="space-y-6">
            {/* Basic Info */}
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
             {/* Details */}
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
            {/* Job Specifics */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name="employment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employment Type</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an employment type" />
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
                     <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                           <SelectValue placeholder="Select an experience level" />
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
            {/* Salary */}
             <div className='grid grid-cols-1 md:grid-cols-3 gap-4 items-start'>
              <FormField
                control={form.control}
                name="salary_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary Min (Optional)</FormLabel>
                    <FormControl>
                       {/* Ensure value is always a string or empty string */}
                       <Input
                        type='number'
                        placeholder="e.g., 50000"
                        {...field}
                        value={field.value ?? ''} // Use empty string for undefined/null
                        onChange={(e) => field.onChange(e.target.value)} // Pass string value
                       />
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
                    <FormLabel>Salary Max (Optional)</FormLabel>
                    <FormControl>
                        {/* Ensure value is always a string or empty string */}
                        <Input
                            type='number'
                            placeholder="e.g., 100000"
                            {...field}
                            value={field.value ?? ''} // Use empty string for undefined/null
                            onChange={(e) => field.onChange(e.target.value)} // Pass string value
                        />
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
                     <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
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
            {/* Expiration Date */}
             <FormField
              control={form.control}
              name="expires_at"
              render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expiration Date (Optional)</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <CalendarButton // Use the renamed import
                                    variant={"outline"}
                                    className={cn(
                                        "w-[240px] pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                >
                                    {field.value ? (
                                        format(field.value, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </CalendarButton>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} // Disable past dates only
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <FormDescription>
                        The date this job posting will expire.
                    </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Submit Button */}
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
