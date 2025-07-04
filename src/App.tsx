import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useAutoLogout } from './hooks/useAutoLogout';
import Login from './components/Auth/Login';
import LoadingScreen from './components/common/LoadingScreen';

// Code splitting - Lazy loading des pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Parameters = React.lazy(() => import('./pages/Parameters'));
const Logbook = React.lazy(() => import('./pages/Logbook'));
const Users = React.lazy(() => import('./pages/Users'));
const Incidents = React.lazy(() => import('./pages/Incidents'));
const Checklist = React.lazy(() => import('./pages/Checklist'));
const Maintenance = React.lazy(() => import('./pages/Maintenance'));
const Technicians = React.lazy(() => import('./pages/Technicians'));
const LostItems = React.lazy(() => import('./pages/LostItems'));
const EmptyModule = React.lazy(() => import('./pages/EmptyModule'));

// Nouveaux modules
const HumanResources = React.lazy(() => import('./pages/HumanResources'));
const DopMissions = React.lazy(() => import('./pages/DopMissions'));
const Housekeeping = React.lazy(() => import('./pages/Housekeeping'));
const Planning = React.lazy(() => import('./pages/Planning'));
const MailAutomation = React.lazy(() => import('./pages/MailAutomation'));
const Chat = React.lazy(() => import('./pages/Chat'));
const LostItemsHistoryPage = React.lazy(() => import('./pages/LostItemsHistoryPage'));
const Procedures = React.lazy(() => import('./pages/Procedures'));
const ProceduresByService = React.lazy(() => import('./pages/ProceduresByService'));



function AppRoutes() {
  const { currentUser } = useAuth();
  
  // Activer la déconnexion automatique pour les utilisateurs connectés
  useAutoLogout();

  if (!currentUser) {
    return <Login />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/logbook" element={<Logbook />} />
        <Route path="/checklist" element={<Checklist />} />
        <Route path="/parameters" element={<Parameters />} />
        <Route path="/users" element={<Users />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/technicians" element={<Technicians />} />
        <Route path="/lost-items" element={<LostItems />} />
        <Route path="/lost-items-history" element={<LostItemsHistoryPage />} />
        
        {/* Nouveaux modules */}
        <Route path="/hr" element={<HumanResources />} />
        <Route path="/dop-missions" element={<DopMissions />} />
        <Route path="/housekeeping" element={<Housekeeping />} />
        <Route path="/planning" element={<Planning />} />
        <Route path="/mail-automation" element={<MailAutomation />} />
        <Route path="/chat" element={<Chat />} />
        
        {/* Modules existants vides */}
        <Route
          path="/quality-visits"
          element={
            <EmptyModule
              title="Visites Qualité"
              subtitle="Gestion des visites qualité"
              icon={<div className="w-8 h-8 text-gray-400">📋</div>}
            />
          }
        />
        <Route path="/procedures" element={<Procedures />} />
        <Route path="/procedures/service/:service" element={<ProceduresByService />} />
        <Route
          path="/gamification"
          element={
            <EmptyModule
              title="Gamification"
              subtitle="Système de gamification"
              icon={<div className="w-8 h-8 text-gray-400">🏆</div>}
            />
          }
        />
        <Route
          path="/suppliers"
          element={
            <EmptyModule
              title="Fournisseurs"
              subtitle="Gestion des fournisseurs"
              icon={<div className="w-8 h-8 text-gray-400">🏢</div>}
            />
          }
        />
        <Route path="/login" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;