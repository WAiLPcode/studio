# Supabase Database Security Implementation

## Row Level Security (RLS) Implementation

This directory contains SQL scripts that set up the database schema and implement Row Level Security (RLS) policies for the JobFinder application.

### Files Overview

- **setup.sql**: Main database schema setup with tables, indexes, triggers, and basic RLS policies
- **rls_policies.sql**: Comprehensive RLS policies for all tables with detailed access controls

## What is Row Level Security (RLS)?

Row Level Security is a PostgreSQL feature that allows database administrators to define security policies that restrict which rows users can access in a table. This ensures that users can only see and modify data they are authorized to access.

## Implemented Security Measures

1. **RLS Enabled on All Tables**: All tables in the public schema now have RLS enabled
2. **User-specific Data Access**: Users can only access their own data
3. **Role-based Permissions**: Different policies for job seekers and employers
4. **Public Read Access**: Some data (like skills and active job postings) is publicly readable
5. **Restricted Write Operations**: Write operations are limited to authorized users

## How to Apply These Changes

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. First run `setup.sql` to create the database schema with basic RLS policies
4. Then run `rls_policies.sql` to apply the comprehensive RLS policies

## Security Considerations

- These policies assume you're using Supabase Auth with `auth.uid()` to identify the current user
- The policies are designed to work with the current application architecture where:
  - Job seekers can view and apply to jobs
  - Employers can post and manage job listings
  - Both can manage their own profiles and data

## Testing RLS Policies

To verify the RLS policies are working correctly:

1. Create multiple test users with different roles
2. Try accessing data that belongs to another user (should be denied)
3. Verify that public data (like skills) is accessible to all users
4. Confirm that job postings are visible to all but only editable by their owners

## Troubleshooting

If you encounter permission issues:

1. Verify that the user is authenticated
2. Check that the user's ID matches the expected format for `auth.uid()`
3. Ensure the policies are correctly applied to all tables
4. Review the Supabase logs for any policy-related errors