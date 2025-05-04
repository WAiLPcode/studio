'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import EmployerProfileForm from '@/components/employer-profile-form';

const EmployerProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto p-4">
      {user ? (
// Suggested code may be subject to a license. Learn more: ~LicenseLog:371849133.
        <div className='w-[98%] mx-auto max-w-3xl bg-white p-6 rounded-lg shadow-md'>
          <h1 className="text-2xl font-bold mb-4">Edit Your Employer Profile</h1>
          <EmployerProfileForm />
        </div>
      ) : (
        <div className='w-[98%] mx-auto max-w-3xl bg-white p-6 rounded-lg shadow-md'>
          <h1 className="text-2xl font-bold mb-4">
          You need to be logged in to see this page
          </h1>
        </div>
      )}
    </div>
  );
};

export default EmployerProfilePage;