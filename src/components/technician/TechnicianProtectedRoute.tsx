import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  isTechnicianLoggedIn, 
  refreshTechnicianSession, 
  checkTechnicianSessionExpiry, 
  logoutTechnician 
} from '@/lib/technician-auth';

interface TechnicianProtectedRouteProps {
  children: React.ReactNode;
}

const TechnicianProtectedRoute: React.FC<TechnicianProtectedRouteProps> = ({ children }) => {
  // Check if technician is logged in and if session has expired
  const isLoggedIn = isTechnicianLoggedIn();
  const hasSessionExpired = checkTechnicianSessionExpiry();
  
  // Handle expired session
  useEffect(() => {
    if (isLoggedIn && hasSessionExpired) {
      console.log("Technician session expired");
      logoutTechnician();
      window.location.href = '/technician-login';
    }
  }, [isLoggedIn, hasSessionExpired]);
  
  // Refresh session if logged in (extends expiration)
  useEffect(() => {
    if (isLoggedIn && !hasSessionExpired) {
      refreshTechnicianSession();
    }
  }, [isLoggedIn, hasSessionExpired]);
  
  if (!isLoggedIn || hasSessionExpired) {
    // Redirect to login page if not logged in or session expired
    return <Navigate to="/technician-login" replace />;
  }

  // Render children if logged in
  return <>{children}</>;
};

export default TechnicianProtectedRoute;