import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Layout
import DashboardLayout from './components/layouts/DashboardLayout';
import TechnicianLayout from './components/technician/TechnicianLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import IncidentsPage from './pages/IncidentsPage';
import MaintenancePage from './pages/MaintenancePage';
import QualityPage from './pages/QualityPage';
import LostFoundPage from './pages/LostFoundPage';
import ProceduresPage from './pages/ProceduresPage';
import StatisticsPage from './pages/StatisticsPage';
import SettingsPage from './pages/SettingsPage';
import UsersPage from './pages/UsersPage';
import GamificationPage from './pages/GamificationPage';
import GamificationConfigPage from './pages/GamificationConfigPage';
import SuppliersPage from './pages/SuppliersPage';
import TechniciansPage from './pages/TechniciansPage';

// Technician pages
import TechnicianDashboard from './pages/technician/TechnicianDashboard';
import TechnicianQuoteRequests from './pages/technician/TechnicianQuoteRequests';
import TechnicianSettings from './pages/technician/TechnicianSettings';

// Auth
import { isAuthenticated, hasModuleAccess, initAuth } from './lib/auth';
import TechnicianProtectedRoute from './components/technician/TechnicianProtectedRoute';

// Toast
import { ToastProvider } from './components/ui/toast';
import { Toaster } from './components/ui/toaster';

// Connection Status Alert
import { Alert, AlertDescription } from './components/ui/alert';
import { WifiOff, Loader2 } from 'lucide-react';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Protected route component
type ProtectedRouteProps = {
  moduleCode?: string;
  children: React.ReactNode;
};

const ProtectedRoute = ({ moduleCode, children }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);

  // Check authentication status with a loading state
  useEffect(() => {
    const checkAuth = () => {
      setLoading(false);
    };
    // Give a short delay to ensure auth state is ready
    const timer = setTimeout(checkAuth, 300);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }
  
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  if (moduleCode && !hasModuleAccess(moduleCode)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Initialize auth on app load
  useEffect(() => {
    initAuth();
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

  return (
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
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            {/* Technician routes */}
            <Route path="/technician" element={
              <TechnicianProtectedRoute>
                <TechnicianLayout />
              </TechnicianProtectedRoute>
            }>
              <Route index element={<Navigate to="/technician/dashboard" replace />} />
              <Route path="dashboard" element={<TechnicianDashboard />} />
              <Route path="quote-requests" element={<TechnicianQuoteRequests />} />
              <Route path="settings" element={<TechnicianSettings />} />
              {/* Add other technician pages here */}
              <Route path="*" element={<Navigate to="/technician/dashboard" replace />} />
            </Route>
            
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
              
              <Route path="technicians" element={
                <ProtectedRoute moduleCode="mod9">
                  <TechniciansPage />
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
              
              <Route path="statistics" element={
                <ProtectedRoute moduleCode="mod7">
                  <StatisticsPage />
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
                  : <Navigate to="/dashboard" replace />
              } 
            />
          </Routes>
        </Router>
        <Toaster />
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;