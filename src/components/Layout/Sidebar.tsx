import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  AlertTriangle,
  Wrench,
  Users,
  ClipboardCheck,
  Package,
  FileText,
  Trophy,
  Building,
  Settings,
  User,
  Moon,
  LogOut,
  Target,
  Sparkles,
  Calendar,
  Mail,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { appModules } from '../../types/users';
import { usersService } from '../../services/firebase/usersService';
import { modulesService } from '../../services/firebase/modulesService';
import { useUserPermissions } from '../../hooks/useUserPermissions';

// Mapping des icônes pour les modules
const iconMap: { [key: string]: React.ComponentType<any> } = {
  'LayoutDashboard': LayoutDashboard,
  'BookOpen': BookOpen,
  'CheckSquare': CheckSquare,
  'AlertTriangle': AlertTriangle,
  'Wrench': Wrench,
  'Users': Users,
  'ClipboardCheck': ClipboardCheck,
  'Package': Package,
  'FileText': FileText,
  'Trophy': Trophy,
  'Building': Building,
  'Settings': Settings,
  'User': User,
  'Target': Target,
  'Sparkles': Sparkles,
  'Calendar': Calendar,
  'Mail': Mail,
  'MessageCircle': MessageCircle,
};

export default function Sidebar() {
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const { userData, accessibleHotels, loading } = useUserPermissions();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [userModules, setUserModules] = React.useState<string[]>([]);
  const [modulesInitialized, setModulesInitialized] = React.useState(false);

  React.useEffect(() => {
    initializeAndLoadModules();
  }, [currentUser, userData]);

  const initializeAndLoadModules = async () => {
    if (!currentUser?.email) {
      return;
    }

    try {
      // Initialiser les modules manquants si nécessaire
      if (!modulesInitialized) {
        const initialized = await modulesService.checkAndInitializeModules();
        if (initialized) {
          console.log('Modules initialisés avec succès');
        }
        setModulesInitialized(true);
      }

      // Charger les permissions utilisateur
      await loadUserModules();
    } catch (error) {
      console.error('Error initializing modules:', error);
      // Continuer avec les modules par défaut en cas d'erreur
      await loadUserModules();
    }
  };

  const loadUserModules = async () => {
    if (!userData) {
      console.log('loadUserModules: userData is null');
      return;
    }

    try {
      console.log('loadUserModules: userData:', userData);
      console.log('loadUserModules: userData.modules:', userData.modules);
      console.log('loadUserModules: userData.role:', userData.role);
      
      // Les administrateurs système ont accès à TOUS les modules sans exception
      if (userData.role === 'system_admin') {
        console.log('loadUserModules: User is system_admin, giving access to all modules');
        // Donner accès à tous les modules sans exception
        setUserModules(appModules.map(m => m.key));
      } else {
        console.log('loadUserModules: User is not system_admin, using userData.modules:', userData.modules || []);
        setUserModules(userData.modules || []);
      }
    } catch (error) {
      console.error('Error loading user modules:', error);
      // En cas d'erreur, utiliser uniquement les modules assignés à l'utilisateur
      setUserModules(userData.modules || []);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Filtrer les modules accessibles basés sur les permissions utilisateur
  console.log('Sidebar: userModules:', userModules);
  console.log('Sidebar: appModules:', appModules);
  const accessibleModules = appModules.filter(module => 
    userModules.includes(module.key)
  );
  console.log('Sidebar: accessibleModules:', accessibleModules);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'system_admin':
        return 'Administrateur Système';
      case 'hotel_admin':
        return 'Administrateur Hôtel';
      default:
        return 'Utilisateur';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white border-r border-warm-200">
        <div className="p-4 border-b border-warm-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-creho-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-warm-900">CREHO</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 border-2 border-creho-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-xs text-warm-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-warm-200 transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-warm-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-creho-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <span className="font-bold text-warm-900 whitespace-nowrap">CREHO</span>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-warm-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-creho-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-creho-600 font-semibold text-sm">
              {currentUser?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className={`flex-1 min-w-0 transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <p className="text-sm font-medium text-warm-900 truncate">
              {currentUser?.email?.split('@')[0]}
            </p>
            <p className="text-xs text-warm-500">{userData ? getRoleLabel(userData.role) : 'Utilisateur'}</p>
            {userData?.role === 'system_admin' && (
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                <span className="text-xs text-green-600 font-medium">Accès complet</span>
              </div>
            )}
            {userData && userData.role !== 'system_admin' && accessibleHotels.length > 0 && (
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                <span className="text-xs text-blue-600 font-medium">{accessibleHotels.length} hôtel(s) accessible(s)</span>
              </div>
            )}
          </div>
        </div>
        <div className={`mt-2 transition-all duration-300 overflow-hidden ${isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100'}`}>
          <div className="flex items-center text-xs text-creho-600">
            <Trophy className="w-3 h-3 mr-1" />
            <span>Voir progression</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${isCollapsed ? 'p-2' : 'p-4'} space-y-1 overflow-y-auto`}>
        {accessibleModules.length === 0 ? (
          <div className="text-center py-8">
            {!isCollapsed && (
              <>
                <p className="text-sm text-warm-600">Aucun module accessible</p>
                <p className="text-xs text-warm-500 mt-1">Contactez votre administrateur</p>
              </>
            )}
          </div>
        ) : (
          accessibleModules.map((module) => {
            const IconComponent = iconMap[module.icon];
            const isActive = location.pathname === module.path;
            
            return (
              <Link
                key={module.key}
                to={module.path}
                className={`flex items-center ${isCollapsed ? 'justify-center px-3 py-3' : 'px-3 py-2'} text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-creho-50 text-creho-700 border-r-2 border-creho-500'
                    : 'text-warm-700 hover:bg-warm-50 hover:text-warm-900'
                }`}
                title={isCollapsed ? module.label : undefined}
              >
                {IconComponent && (
                  <IconComponent className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'} ${isActive ? 'text-creho-500' : 'text-warm-400'}`} />
                )}
                {!isCollapsed && module.label}
              </Link>
            );
          })
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-warm-200 space-y-2">
        <button className={`flex items-center w-full ${isCollapsed ? 'justify-center px-3 py-3' : 'px-3 py-2'} text-sm font-medium text-warm-700 rounded-lg hover:bg-warm-50`} title={isCollapsed ? 'Mode Sombre' : undefined}>
          <Moon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'} text-warm-400`} />
          {!isCollapsed && 'Mode Sombre'}
        </button>
        <button
          onClick={handleLogout}
          className={`flex items-center w-full ${isCollapsed ? 'justify-center px-3 py-3' : 'px-3 py-2'} text-sm font-medium text-red-600 rounded-lg hover:bg-red-50`}
          title={isCollapsed ? 'Déconnexion' : undefined}
        >
          <LogOut className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'} text-red-500`} />
          {!isCollapsed && 'Déconnexion'}
        </button>
      </div>
    </div>
  );
}