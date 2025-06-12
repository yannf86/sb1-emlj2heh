import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query-client';
import { usePrefetchData, useOptimizedQueries } from './hooks/useQueries';

// Layout
import DashboardLayout from './components/layouts/DashboardLayout';
import ErrorBoundary from './components/layouts/ErrorBoundary';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import IncidentsPage from './pages/IncidentsPage';
import MaintenancePage from './pages/MaintenancePage';
import QualityPage from './pages/QualityPage';
import LostFoundPage from './pages/LostFoundPage';
import ProceduresPage from './pages/ProceduresPage';
import SettingsPage from './pages/SettingsPage';
import UsersPage from './pages/UsersPage';
import TechniciansPage from './pages/TechniciansPage';
import GamificationPage from './pages/GamificationPage';
import GamificationConfigPage from './pages/GamificationConfigPage';
import SuppliersPage from './pages/SuppliersPage';
import LogbookPage from './pages/LogbookPage'; 
import ChecklistPage from './pages/ChecklistPage';

// Auth
import { isAuthenticated, hasModuleAccess, initAuth, resetInactivityTimer } from './lib/auth';

// Toast
import { ToastProvider } from './components/ui/toast';
import { Toaster } from './components/ui/toaster';

// Connection Status Alert
import { Alert, AlertDescription } from './components/ui/alert';
import { WifiOff, Loader2 } from 'lucide-react';

// DataCacheProvider component for managing data prefetching
const DataCacheProvider = ({ children }) => {
  usePrefetchData();
  useOptimizedQueries();
  return children;
};

// Protected route component
type ProtectedRouteProps = {
  moduleCode?: string;
  children: React.ReactNode;
};

const ProtectedRoute = ({ moduleCode, children }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  // Check authentication status with a loading state
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = isAuthenticated();
      setAuthenticated(isAuth);
      
      if (isAuth && moduleCode) {
        setHasAccess(hasModuleAccess(moduleCode));
      } else if (isAuth) {
        setHasAccess(true);
      }
      
      setLoading(false);
    };
    
    // Give a short delay to ensure auth state is ready
    const timer = setTimeout(checkAuth, 300);
    return () => clearTimeout(timer);
  }, [moduleCode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-brand-500" />
      </div>
    );
  }
  
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (moduleCode && !hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);

  // Initialize auth on app load
  useEffect(() => {
    initAuth();
    setAuthInitialized(true);
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Activity monitoring to reset inactivity timer
  useEffect(() => {
    resetInactivityTimer();
    
    // Add event listeners to reset timer on user activity
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => resetInactivityTimer();
    
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (authInitialized && !isAuthenticated() && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }, [authInitialized]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          {!isOnline && (
            <Alert variant="destructive" className="fixed top-0 left-0 right-0 z-50 flex justify-center">
              <WifiOff className="h-4 w-4 mr-2" />
              <AlertDescription>
                Connexion internet perdue. Application en mode hors ligne.
              </AlertDescription>
            </Alert>
          )}
          
          <ErrorBoundary>
            <DataCacheProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                
                <Route path="/" element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  
                  <Route path="dashboard" element={
                    <ProtectedRoute moduleCode="mod1">
                      <DashboardPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="logbook" element={
                    <ProtectedRoute moduleCode="mod12">
                      <LogbookPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="checklist" element={
                    <ProtectedRoute moduleCode="mod13">
                      <ChecklistPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="incidents" element={
                    <ProtectedRoute moduleCode="mod2">
                      <IncidentsPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="maintenance" element={
                    <ProtectedRoute moduleCode="mod3">
                      <MaintenancePage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="quality" element={
                    <ProtectedRoute moduleCode="mod4">
                      <QualityPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="lost-found" element={
                    <ProtectedRoute moduleCode="mod5">
                      <LostFoundPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="procedures" element={
                    <ProtectedRoute moduleCode="mod6">
                      <ProceduresPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="settings" element={
                    <ProtectedRoute moduleCode="mod8">
                      <SettingsPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="settings/gamification-config" element={
                    <ProtectedRoute moduleCode="mod8">
                      <GamificationConfigPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="users" element={
                    <ProtectedRoute moduleCode="mod9">
                      <UsersPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="technicians" element={
                    <ProtectedRoute moduleCode="mod3">
                      <TechniciansPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="gamification" element={
                    <ProtectedRoute moduleCode="mod10">
                      <GamificationPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="suppliers" element={
                    <ProtectedRoute moduleCode="mod11">
                      <SuppliersPage />
                    </ProtectedRoute>
                  } />
                </Route>
                
                <Route 
                  path="*" 
                  element={
                    window.location.pathname.startsWith("/dev")
                      ? <div style={{ padding: "2rem", textAlign: "center" }}><h2>Page non trouvée</h2></div>
                      : <Navigate to="/login" replace />
                  } 
                />
              </Routes>
            </DataCacheProvider>
          </ErrorBoundary>
          <Toaster />
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;