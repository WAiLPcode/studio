# **App Name**: JobFinder

## Core Features:

- Browse Job Listings: Display job postings in a card-based layout, filterable by location.
- View Job Details: Dedicated page for each job with full description and application instructions.
- Post New Job: Form for employers to post jobs (title, company, location, description, instructions).

## Style Guidelines:

- Primary color: Neutral gray for a professional look.
- Secondary color: Light gray for backgrounds and subtle accents.
- Accent: Teal (#008080) for buttons and interactive elements.
- Card-based layout for job listings on the homepage.
- Simple, professional icons for job categories and locations.

## Original User Request:
Here’s a structured prompt tailored to your requirements using **React**, **TailwindCSS**, and **Supabase**:

---

Name app: domirwk 

### **App Goal**  
Create a simple job board web application where job seekers can browse job listings filtered by location, and employers can post job vacancies. The app should use **React** for the frontend, **TailwindCSS** for styling, and **Supabase** for storing/retrieving job data.

---

### **Key Features**  
1. **Browse Job Listings**  
   - Display all job postings in a responsive **card-based layout** on the homepage.  
   - Filter jobs by **location** (e.g., "New York", "Remote").  

2. **View Job Details**  
   - Clicking a job card navigates to a dedicated page showing the full job description and **application instructions**.  

3. **Post New Job**  
   - A form page where employers can submit:  
     - Title, Company Name, Location, Description, Application Instructions.  
   - Store submissions in Supabase (no authentication required for this prototype).  

---

### **Technology Stack**  
- **Frontend**: React + React Router for navigation.  
- **Styling**: TailwindCSS (responsive design).  
- **Backend**: Supabase (for database and storage).  

---

### **Supabase Integration**  
1. **Database Setup**  
   - Create a table `job_postings` with the following columns:  
     ```sql
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  
     title TEXT,  
     company_name TEXT,  
     location TEXT,  
     description TEXT,  
     application_instructions TEXT,  
     created_at TIMESTAMP DEFAULT NOW()  
     ```  

2. **API Usage**  
   - Use Supabase SDK to:  
     - Fetch all jobs (`SELECT * FROM job_postings`).  
     - Insert new jobs (`INSERT INTO job_postings (...) VALUES (...)`).  

---

### **UI/UX Requirements**  
- **Navigation Bar**: Links to "Home" and "Post a Job".  
- **Homepage**:  
  - Search/filter bar for location.  
  - Responsive grid of job cards (title, company, location).  
- **Job Detail Page**: Full job description and application instructions.  
- **Post Job Form**: Simple form with validation (e.g., required fields).  

---

### **Data Flow Example**  
1. **Fetching Jobs**:  
   ```javascript  
   const { data, error } = await supabase.from('job_postings').select('*');  
   ```  

2. **Posting a Job**:  
   ```javascript  
   const { error } = await supabase.from('job_postings').insert([  
     { title, company_name, location, description, application_instructions }  
   ]);  
   ```  

---

### **Example Code Structure**  
```bash  
/src  
  /components  
    JobCard.jsx  
    JobDetail.jsx  
    PostJobForm.jsx  
  /pages  
    Home.jsx (job listings + filter)  
    PostJob.jsx (form)  
    JobDetailPage.jsx  
  App.js (routes)  
  supabaseClient.js (configured Supabase client)  
```  

---

### **Constraints**  
- Focus on **CRUD basics**: Read (browse jobs) and Create (post jobs).  
- Skip user authentication for employers (prototype-friendly).  
- No need for advanced features like search filters beyond location.  

---

### **Bonus Suggestions**  
- Add a "How to Apply" section in job details.  
- Include a success message after submitting a job.  
- Style job cards with hover effects and a "Apply Now" button.  

---

### **Supabase Setup Hints**  
1. Create a Supabase project and copy your `SUPABASE_URL` and `SUPABASE_KEY`.  
2. Configure the client in `supabaseClient.js`:  
   ```javascript  
   import { createClient } from '@supabase/supabase-js';  
   const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_KEY);  
   export default supabase;  
   ```  

3. Use environment variables in `.env` for secure configuration.  

---

This prompt ensures a clean, functional prototype focused on core job board functionality. Let me know if you’d like help scaffolding the code or deploying the app! 🚀
  