"use client";

import { useAuth } from '@/contexts/auth-context';
import JobSeekerProfileForm from '@/components/job-seeker-profile-form';

const JobSeekerProfilePage = () => {
  const { user } = useAuth();
  return (
    <div className="container mx-auto py-10">
      {user ? (
        <>
          <h1 className="text-2xl font-bold mb-4">Edit Your User Profile</h1>
          <JobSeekerProfileForm />
        </>
      ) : (
        <div className="text-center">
          <p className="text-lg text-gray-600">
            You need to be logged in to view your profile.
          </p>
        </div>
      )}
    </div>
  );
};

export default JobSeekerProfilePage;
