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
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDesc } from '@/components/ui/card'; // Aliased CardDescription
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from 'react'; // Added useEffect
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
   // Accept string input, transform to number or undefined, refine for positive values
  salary_min: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)), // Handle empty string, null, undefined
    z.number({ invalid_type_error: "Must be a number" }).positive({ message: "Must be positive" }).optional()
  ),
  salary_max: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)), // Handle empty string, null, undefined
    z.number({ invalid_type_error: "Must be a number" }).positive({ message: "Must be positive" }).optional()
  ),
  salary_currency: z.enum(salaryCurrencies).default('USD'),
  experience_level: z.enum(experienceLevels, { required_error: 'Please select an experience level.' }),
  expires_at: z.date({ required_error: 'Please select an expiration date.' }).optional(), // Optional expiration date
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
  // Use state to manage the Supabase client instance to avoid hydration issues
  const [supabase, setSupabase] = useState<ReturnType<typeof getSupabaseBrowserClient> | null>(null);
  const [clientInitialized, setClientInitialized] = useState(false);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize Supabase client only on the client side
  useEffect(() => {
    // Ensure this runs only in the browser
    if (typeof window !== 'undefined') {
        setSupabase(getSupabaseBrowserClient());
        setClientInitialized(true); // Mark client as initialized
    }
  }, []);


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
            description: 'Supabase client is not ready. Please wait and try again.',
            variant: "destructive",
        });
        setIsSubmitting(false);
        return;
    }
    try {
        // Explicitly map form values to database columns
        // This improves clarity and helps prevent issues if form field names diverge from DB columns
        const dataToInsert = {
            title: values.title,
            company_name: values.company_name, // Ensure this matches the DB column name exactly
            location: values.location,
            description: values.description,
            application_instructions: values.application_instructions,
            employment_type: values.employment_type,
            experience_level: values.experience_level,
            salary_min: values.salary_min ?? null, // Convert undefined to null for DB
            salary_max: values.salary_max ?? null, // Convert undefined to null for DB
            salary_currency: values.salary_currency,
            expires_at: values.expires_at?.toISOString() ?? null, // Convert Date to ISO string or null
        };

        console.log("Submitting values to Supabase:", dataToInsert); // Log data being sent

        // Call Supabase insert
        const { data, error } = await supabase
            .from('job_postings')
            .insert([dataToInsert]) // Use the explicitly mapped object
            .select() // Add select() to potentially get more info on error or success
            .single(); // Assuming we expect one row back on success, adjust if needed


        if (error) {
             // Log the raw error object first to inspect its structure
             console.error('Raw Supabase insert error object:', error); // This log might show {} if the error is minimal

             // Log specific details if available, guarding against undefined/null
             // Use JSON.stringify for a better representation if the object structure is unknown
             console.error('Supabase insert error (stringified):', JSON.stringify(error, null, 2));
             console.error('Supabase insert error details:', {
                message: error?.message ?? 'No message available',
                details: error?.details ?? 'No details available',
                hint: error?.hint ?? 'No hint available',
                code: error?.code ?? 'No code available',
             });

            toast({
              title: "Error Posting Job",
              // Provide a more informative default message and include the code if possible
              description: `Failed to post job. ${error.message || 'Check console.'} ${error.code ? `(Code: ${error.code})` : ''}. Please verify your Supabase table schema and column names (e.g., 'company_name'). Also check RLS permissions.`,
              variant: "destructive",
              duration: 10000, // Keep toast longer
            });
             setIsSubmitting(false);
             return; // Exit the function on error
        }

        // Success path
        console.log("Job posted successfully:", data); // Log success data
        toast({
            title: "Success!",
            description: "Your job posting has been submitted.",
            variant: "default",
        });
        form.reset(); // Reset form to default values
    } catch (err: any) { // Catch unexpected errors during the submission process
         console.error('Submit function catch block error:', err);
        toast({
            title: "Submission Error",
            description: err.message || 'An unexpected error occurred while posting the job.',
            variant: "destructive",
        });
    } finally {
       setIsSubmitting(false);
    }
  }

  // // Log form state changes for debugging (Optional)
  // React.useEffect(() => {
  //   const subscription = form.watch((value, { name, type }) => {
  //      console.log("Form values:", value);
  //      console.log("Form errors:", form.formState.errors);
  //   });
  //   return () => subscription.unsubscribe();
  // }, [form]);


  return (
    <Card className="max-w-2xl mx-auto shadow-md">
      <CardHeader>
         {/* Conditional Rendering based on client initialization */}
        <CardTitle className="text-2xl font-bold text-center text-primary">
           {clientInitialized ? (supabase ? 'Post a New Job' : 'Connection Error') : 'Loading Form...'}
         </CardTitle>
         {clientInitialized && !supabase && (
            <CardDesc className="text-center text-destructive">
                 Could not initialize connection to the database. Please check setup.
            </CardDesc>
         )}
      </CardHeader>
      <CardContent>
         {/* Conditionally render Alert or Form based on Supabase client state */}
         {clientInitialized && !supabase ? (
            <Alert variant="destructive">
              <AlertTitle>Initialization Error</AlertTitle>
              <AlertDescription>Supabase client could not be initialized. Please check your environment variables (e.g., `.env.local`) and ensure the application has browser access.</AlertDescription>
            </Alert>
         ) : !clientInitialized ? (
            // Show a loading state while client initializes
             <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground text-sm">Initializing...</p>
             </div>
         ) : (
           // Render the form only if client is initialized and supabase exists
            <Form {...form}>
              {/* Added error logging for submit handler */}
              <form onSubmit={form.handleSubmit(onSubmit, (errors) => console.log("Form validation errors:", errors))} className="space-y-6">
                {/* Basic Info */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                         {/* Ensure value is always a string */}
                        <Input placeholder="e.g., Software Engineer" {...field} value={field.value ?? ''} aria-required="true" />
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
                        <Input placeholder="e.g., Tech Corp" {...field} value={field.value ?? ''} aria-required="true"/>
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
                        <Input placeholder="e.g., New York, NY or Remote" {...field} value={field.value ?? ''} aria-required="true"/>
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
                           value={field.value ?? ''}
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
                          value={field.value ?? ''}
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
                           {/* Ensure value is always a string for the input */}
                           <Input
                            type='number'
                            placeholder="e.g., 50000"
                            {...field}
                            value={field.value ?? ''} // Use empty string for undefined/null
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)} // Pass string value or undefined
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
                            {/* Ensure value is always a string for the input */}
                            <Input
                                type='number'
                                placeholder="e.g., 100000"
                                {...field}
                                value={field.value ?? ''} // Use empty string for undefined/null
                                onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)} // Pass string value or undefined
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
                                    // Disable dates strictly before today (midnight)
                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <FormDescription>
                            The date this job posting will expire (optional).
                        </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Submit Button */}
                <Button
                    type="submit"
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    disabled={isSubmitting || !clientInitialized || !supabase} // Disable if submitting or client not ready
                >
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
         )}

      </CardContent>
    </Card>
  );
}
