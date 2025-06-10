import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { isTechnicianLoggedIn, refreshTechnicianSession } from '@/lib/technician-auth';

interface TechnicianProtectedRouteProps {
  children: React.ReactNode;
}

const TechnicianProtectedRoute: React.FC<TechnicianProtectedRouteProps> = ({ children }) => {
  // Check if technician is logged in
  const isLoggedIn = isTechnicianLoggedIn();
  
  // Refresh session if logged in (extends expiration)
  useEffect(() => {
    if (isLoggedIn) {
      refreshTechnicianSession();
    }
  }, [isLoggedIn]);
  
  if (!isLoggedIn) {
    // Redirect to login page if not logged in
    return <Navigate to="/technician-login" replace />;
  }

  // Render children if logged in
  return <>{children}</>;
};

export default TechnicianProtectedRoute;