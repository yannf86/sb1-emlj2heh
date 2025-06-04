import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { 
  isTechnicianLoggedIn, 
  refreshTechnicianSession, 
  checkTechnicianSessionExpiry, 
  logoutTechnician,
  getCurrentTechnician
} from '@/lib/technician-auth';
import { Building, Loader2 } from 'lucide-react';

interface TechnicianProtectedRouteProps {
  children: React.ReactNode;
}

const TechnicianProtectedRoute: React.FC<TechnicianProtectedRouteProps> = ({ children }) => {
  // State to track authentication status
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null means "checking"
  const navigate = useNavigate();
  
  // Function to check authentication status
  const checkAuthStatus = () => {
    const technician = getCurrentTechnician();
    const loggedIn = isTechnicianLoggedIn();
    const sessionExpired = checkTechnicianSessionExpiry();
    
    if (!technician || !loggedIn || sessionExpired) {
      console.log("Technician not authenticated or session expired");
      logoutTechnician();
      setIsAuthenticated(false);
      return false;
    }
    
    // Refresh session to extend expiration but don't trigger a re-render
    refreshTechnicianSession();
    
    // Only update state if it's changed to prevent unnecessary renders
    if (isAuthenticated !== true) {
      setIsAuthenticated(true);
    }
    return true;
  };
  
  // Initial authentication check
  useEffect(() => {
    checkAuthStatus();
  }, []);
  
  // Periodic authentication check (every 5 minutes to reduce flickering)
  useEffect(() => {
    if (isAuthenticated) {
      const intervalId = setInterval(() => {
        // Perform check but don't trigger re-render unless necessary
        if (!checkAuthStatus()) {
          // Only navigate away if authentication failed
          navigate('/technician-login');
        }
      }, 300000); // Check every 5 minutes instead of every 60 seconds
      
      return () => clearInterval(intervalId);
    }
  }, [isAuthenticated, navigate]);

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Building className="h-12 w-12 text-brand-500 mx-auto mb-4" />
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-brand-500" />
          <p className="text-lg font-medium">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/technician-login" replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default TechnicianProtectedRoute;