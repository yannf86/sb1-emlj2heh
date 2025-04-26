import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Layout
import DashboardLayout from './components/layouts/DashboardLayout';

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

// Auth
import { isAuthenticated, hasModuleAccess } from './lib/auth';

// Toast
import { ToastProvider } from './components/ui/toast';
import { Toaster } from './components/ui/toaster';

// Connection Status Alert
import { Alert, AlertDescription } from './components/ui/alert';
import { WifiOff } from 'lucide-react';

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
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
        <Toaster />
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;