import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  PenTool as Tool, 
  ClipboardCheck, 
  Search, 
  FileText, 
  Settings, 
  Users, 
  ChevronLeft, 
  Menu, 
  LogOut, 
  Building, 
  Moon, 
  Sun,
  Trophy,
  Truck,
  BookOpen,
  Wrench,
  CheckSquare
} from 'lucide-react';
import { getCurrentUser, logout, resetInactivityTimer } from '@/lib/auth';
import { getGroups } from '@/lib/db/groups';
import { useHotels } from '@/hooks/useHotels';
import { queryClient } from '@/lib/query-client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { modules } from '@/lib/modules';

// Gamification
import { GamificationProvider } from '@/components/gamification/GamificationContext';
import GamificationDialog from '@/components/gamification/GamificationDialog';
import RecentBadgeToast from '@/components/gamification/RecentBadgeToast';
import { useGamification } from '@/components/gamification/GamificationContext';

// Badge indicator pour le niveau
const UserLevelBadge = () => {
  const { level } = useGamification();
  
  if (!level) return null;
  
  return (
    <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs text-white">
      {level.level}
    </div>
  );
};

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [gamificationOpen, setGamificationOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [availableGroups, setAvailableGroups] = useState<any[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const { data: hotels = [] } = useHotels();
  
  // Reset inactivity timer on any user interaction with the dashboard
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
  
  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  // Load available groups
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const groups = await getGroups();
        setAvailableGroups(groups);
        
        // Set default group if user has access to exactly one group
        if (groups.length === 1) {
          setSelectedGroup(groups[0].id);
        }
      } catch (error) {
        console.error('Error loading groups:', error);
      }
    };
    
    if (currentUser) {
      loadGroups();
    }
  }, [currentUser]);
  
  // Get current path without leading slash
  const currentPath = location.pathname.substring(1);
  
  // Array of navigation items
  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Tableau de Bord', path: 'dashboard', moduleId: 'mod1' },
    { icon: <BookOpen size={20} />, label: 'Cahier de Consignes', path: 'logbook', moduleId: 'mod12' },
    { icon: <CheckSquare size={20} />, label: 'Check-list', path: 'checklist', moduleId: 'mod13' },
    { icon: <AlertTriangle size={20} />, label: 'Suivi Incidents', path: 'incidents', moduleId: 'mod2' },
    { icon: <Tool size={20} />, label: 'Suivi Technique', path: 'maintenance', moduleId: 'mod3' },
    { icon: <Wrench size={20} />, label: 'Techniciens', path: 'technicians', moduleId: 'mod3' },
    { icon: <ClipboardCheck size={20} />, label: 'Visites Qualité', path: 'quality', moduleId: 'mod4' },
    { icon: <Search size={20} />, label: 'Objets Trouvés', path: 'lost-found', moduleId: 'mod5' },
    { icon: <FileText size={20} />, label: 'Procédures', path: 'procedures', moduleId: 'mod6' },
    { icon: <Trophy size={20} />, label: 'Gamification', path: 'gamification', moduleId: 'mod10' },
    { icon: <Truck size={20} />, label: 'Fournisseurs', path: 'suppliers', moduleId: 'mod11' },
    { icon: <Settings size={20} />, label: 'Paramètres', path: 'settings', moduleId: 'mod8' },
    { icon: <Users size={20} />, label: 'Utilisateurs', path: 'users', moduleId: 'mod9' },
  ];
  
  // Filter nav items by user's module access
  const filteredNavItems = navItems.filter(item => {
    if (!currentUser) return false;
    
    if (currentUser.role === 'admin') return true;
    
    return currentUser.modules.some(m => m === item.moduleId);
  });
  
  // Handle logout
  const handleLogout = () => {
    // Clear cache on logout
    queryClient.clear();
    logout();
    navigate('/login');
  };
  
  // Get user's initials for the avatar
  const getUserInitials = () => {
    if (!currentUser || !currentUser.name) return 'U';
    
    const nameParts = currentUser.name.trim().split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
  };

  // Handle group change
  const handleGroupChange = (groupId: string) => {
    setSelectedGroup(groupId === 'all' ? null : groupId);
    // You might want to refresh data based on selected group
  };
  
  return (
    <GamificationProvider>
      <div className={cn("flex h-screen bg-cream-100 dark:bg-charcoal-900", darkMode ? 'dark' : '')}>
        {/* Desktop Sidebar */}
        <div className={cn(
          "hidden md:flex flex-col border-r border-cream-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64"
        )}>
          {/* Sidebar Header */}
          <div className="p-4 flex items-center justify-between border-b border-cream-200 dark:border-charcoal-700">
            {!collapsed && <h1 className="text-xl font-bold text-brand-500 dark:text-brand-400">CREHO</h1>}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCollapsed(!collapsed)}
            >
              <ChevronLeft className={cn("h-5 w-5 transition-transform", collapsed && "rotate-180")} />
            </Button>
          </div>
          
          {/* Group Selector (when not collapsed) */}
          {!collapsed && availableGroups.length > 0 && (
            <div className="p-4 border-b border-cream-200 dark:border-charcoal-700">
              <Select 
                value={selectedGroup || 'all'}
                onValueChange={handleGroupChange}
              >
                <SelectTrigger>
                  <Building className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Tous les groupes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les groupes</SelectItem>
                  {availableGroups.map(group => (
                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* User Info */}
          <div className={cn(
            "p-4 border-b border-cream-200 dark:border-charcoal-700",
            collapsed ? "flex justify-center" : "flex items-center space-x-3"
          )}>
            <div className="relative">
              <Avatar onClick={() => setGamificationOpen(true)} className="cursor-pointer hover:ring-2 hover:ring-brand-300 transition-all">
                <AvatarFallback className="bg-brand-500 text-white">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <UserLevelBadge />
            </div>
            
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-medium dark:text-white">{currentUser?.name}</span>
                <span className="text-xs text-charcoal-500 dark:text-cream-300">
                  {currentUser?.role === 'admin' ? 'Administrateur' : 
                   currentUser?.role === 'group_admin' ? 'Admin de Groupe' :
                   currentUser?.role === 'hotel_admin' ? 'Admin d\'Hôtel' :
                   'Utilisateur'}
                </span>
                {!collapsed && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-1 h-7 text-xs px-2 justify-start text-brand-500"
                    onClick={() => navigate('/gamification')}
                  >
                    <Trophy className="h-3.5 w-3.5 mr-1" /> Voir progression
                  </Button>
                )}
              </div>
            )}
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {filteredNavItems.map((item) => (
                <li key={item.path}>
                  <Link 
                    to={`/${item.path}`} 
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      currentPath === item.path ? 
                        "bg-brand-100 text-brand-600 dark:bg-charcoal-800 dark:text-brand-400" : 
                        "text-charcoal-700 hover:bg-cream-100 hover:text-brand-600 dark:text-cream-300 dark:hover:bg-charcoal-800 dark:hover:text-brand-400",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    <span className="flex-none">{item.icon}</span>
                    {!collapsed && <span className="ml-3">{item.label}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Sidebar Footer */}
          <div className="p-4 border-t border-cream-200 dark:border-charcoal-700 flex flex-col space-y-2">
            {/* Dark Mode Toggle */}
            <Button
              variant="outline"
              size={collapsed ? "icon" : "default"}
              onClick={() => setDarkMode(!darkMode)}
              className="w-full"
            >
              {darkMode ? (
                <>
                  <Sun size={18} className={collapsed ? "" : "mr-2"} />
                  {!collapsed && "Mode Clair"}
                </>
              ) : (
                <>
                  <Moon size={18} className={collapsed ? "" : "mr-2"} />
                  {!collapsed && "Mode Sombre"}
                </>
              )}
            </Button>
            
            {/* Logout Button */}
            <Button
              variant="ghost"
              size={collapsed ? "icon" : "default"}
              onClick={handleLogout}
              className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 dark:hover:text-red-400"
            >
              <LogOut size={18} className={collapsed ? "" : "mr-2"} />
              {!collapsed && "Déconnexion"}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-64 h-full bg-white dark:bg-charcoal-900 p-4" onClick={(e) => e.stopPropagation()}>
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-brand-500 dark:text-brand-400">CREHO</h1>
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Group Selector (Mobile) */}
              {availableGroups.length > 0 && (
                <div className="mb-4">
                  <Select 
                    value={selectedGroup || 'all'}
                    onValueChange={handleGroupChange}
                  >
                    <SelectTrigger>
                      <Building className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Tous les groupes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les groupes</SelectItem>
                      {availableGroups.map(group => (
                        <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* User Info */}
              <div className="flex items-center px-4 py-6 border-b border-cream-200 dark:border-charcoal-700">
                <div className="relative">
                  <Avatar onClick={() => {
                    setMobileMenuOpen(false);
                    setGamificationOpen(true);
                  }} className="cursor-pointer">
                    <AvatarFallback className="bg-brand-500 text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <UserLevelBadge />
                </div>
                <div className="ml-3">
                  <div className="font-medium">{currentUser?.name}</div>
                  <div className="text-xs text-brand-500 dark:text-brand-300">
                    {currentUser?.role === 'admin' ? 'Administrateur' : 
                     currentUser?.role === 'group_admin' ? 'Admin de Groupe' :
                     currentUser?.role === 'hotel_admin' ? 'Admin d\'Hôtel' :
                     'Utilisateur'}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-7 text-xs px-2 justify-start text-brand-500"
                    onClick={() => {
                      navigate('/gamification');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Trophy className="h-3.5 w-3.5 mr-1" /> Voir progression
                  </Button>
                </div>
              </div>
              
              {/* Mobile Navigation */}
              <nav className="mt-5 flex-1 overflow-y-auto">
                <ul className="space-y-1">
                  {filteredNavItems.map((item) => (
                    <Link 
                      key={item.path} 
                      to={`/${item.path}`}
                      className={cn(
                        "group flex items-center px-2 py-2 text-base font-medium rounded-md hover:bg-cream-100 hover:text-brand-600 dark:hover:bg-charcoal-800 dark:hover:text-brand-400",
                        currentPath === item.path ? 
                          "bg-brand-100 text-brand-600 dark:bg-charcoal-800 dark:text-brand-400" : 
                          "text-charcoal-700 dark:text-cream-300"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.icon}
                      <span className="ml-3">{item.label}</span>
                    </Link>
                  ))}
                </ul>
              </nav>
              
              {/* Mobile Menu Footer */}
              <div className="p-4 border-t border-cream-200 dark:border-charcoal-700">
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 dark:hover:text-red-400"
                >
                  <LogOut size={18} className="mr-2" />
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="border-b border-cream-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 p-4 flex items-center justify-between">
            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Group Selector (Mobile Compact) */}
            {availableGroups.length > 0 && (
              <div className="md:hidden">
                <Select 
                  value={selectedGroup || 'all'}
                  onValueChange={handleGroupChange}
                >
                  <SelectTrigger className="w-[150px]">
                    <Building className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Groupe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les groupes</SelectItem>
                    {availableGroups.map(group => (
                      <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Trophy Button (Mobile) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/gamification')}
              className="md:hidden flex items-center text-sm border-brand-200 hover:border-brand-300 hover:bg-brand-50 text-brand-600"
            >
              <Trophy size={16} className="mr-1" />
              Progression
            </Button>
            
            {/* Hotel Selector */}
            <div className="ml-auto flex items-center space-x-2">
              <Building className="h-5 w-5 text-brand-500" />
              <span className="text-sm font-medium dark:text-white">
                {currentUser?.role === 'admin' ? 'Tous les hôtels' : 
                  currentUser?.hotels.length === 1 ? 
                    (Array.isArray(hotels) && hotels.find(h => h.id === currentUser.hotels[0])?.name) || 'Hôtel inconnu' : 
                    `${currentUser?.hotels.length} hôtels`
                }
              </span>
            </div>
          </header>
          
          {/* Content */}
          <main className="flex-1 overflow-auto p-4 bg-cream-100 dark:bg-charcoal-900">
            <Outlet />
          </main>
        </div>
        
        {/* Gamification Dialog */}
        <GamificationDialog 
          isOpen={gamificationOpen} 
          onClose={() => setGamificationOpen(false)} 
        />
        
        {/* Toast for new badges */}
        <RecentBadgeToast />
      </div>
    </GamificationProvider>
  );
};

export default DashboardLayout;