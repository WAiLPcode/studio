'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import EmployerProfileForm from '@/components/employer-profile-form';

const EmployerProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto p-4">
      {user ? (
        <>
          <h1 className="text-2xl font-bold mb-4">Edit Your Employer Profile</h1>
          <EmployerProfileForm />
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-4">
          You need to be logged in to see this page
          </h1>
        </>
        
      )}
    </div>
  );
};

export default EmployerProfilePage;