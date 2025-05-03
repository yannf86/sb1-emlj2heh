import React, { useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Menu, 
  Home, 
  Clipboard, 
  Calendar, 
  Settings, 
  LogOut, 
  Wrench,
  Bell,
  ChevronLeft
} from 'lucide-react';
import { getCurrentTechnician, logoutTechnician } from '@/lib/technician-auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const TechnicianLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const technician = getCurrentTechnician();

  // Handle logout
  const handleLogout = () => {
    logoutTechnician();
    navigate('/technician-login');
  };

  // Get technician initials for avatar
  const getTechnicianInitials = () => {
    if (!technician || !technician.name) return '?';
    
    const nameParts = technician.name.trim().split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  // Navigation items
  const navItems = [
    { icon: <Home size={20} />, label: 'Tableau de Bord', path: 'dashboard' },
    { icon: <Clipboard size={20} />, label: 'Demandes de devis', path: 'quote-requests' },
    { icon: <Calendar size={20} />, label: 'Planning', path: 'schedule' },
    { icon: <Settings size={20} />, label: 'Paramètres', path: 'settings' },
  ];

  return (
    <div className="flex h-screen bg-cream-100 dark:bg-charcoal-900">
      {/* Desktop Sidebar */}
      <div className={`hidden md:flex flex-col border-r border-cream-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 transition-all duration-300 ease-in-out ${
        collapsed ? "w-16" : "w-64"
      }`}>
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-cream-200 dark:border-charcoal-700">
          {!collapsed && <h1 className="text-xl font-bold text-brand-500 dark:text-brand-400">ESPACE TECH</h1>}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
          >
            <ChevronLeft className={`h-5 w-5 transition-transform ${collapsed && "rotate-180"}`} />
          </Button>
        </div>
        
        {/* User Info */}
        <div className={`p-4 border-b border-cream-200 dark:border-charcoal-700 ${
          collapsed ? "flex justify-center" : "flex items-center space-x-3"
        }`}>
          <Avatar className="cursor-pointer">
            <AvatarFallback className="bg-brand-500 text-white">
              {getTechnicianInitials()}
            </AvatarFallback>
          </Avatar>
          
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-medium dark:text-white">{technician?.name}</span>
              <span className="text-xs text-brand-500 dark:text-brand-300">
                {technician?.company || 'Technicien indépendant'}
              </span>
            </div>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link 
                  to={`/technician/${item.path}`} 
                  className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-cream-100 hover:text-brand-600 dark:hover:bg-charcoal-800 dark:hover:text-brand-400 ${
                    collapsed && "justify-center px-2"
                  }`}
                >
                  <span className="flex-none">{item.icon}</span>
                  {!collapsed && <span className="ml-3">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-cream-200 dark:border-charcoal-700 mt-auto">
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
      
      {/* Mobile Header */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden border-b border-cream-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 p-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <h1 className="text-lg font-bold text-brand-500 dark:text-brand-400">
            ESPACE TECHNICIEN
          </h1>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/technician/notifications')}
          >
            <Bell className="h-5 w-5" />
          </Button>
        </header>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div 
              className="fixed inset-0 bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white dark:bg-charcoal-900 pt-5 pb-4">
              <div className="flex items-center justify-between px-4">
                <h2 className="text-lg font-medium text-brand-500 dark:text-brand-400">Menu</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="flex items-center px-4 py-6 border-b border-cream-200 dark:border-charcoal-700">
                <Avatar className="cursor-pointer">
                  <AvatarFallback className="bg-brand-500 text-white">
                    {getTechnicianInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <div className="font-medium">{technician?.name}</div>
                  <div className="text-xs text-brand-500 dark:text-brand-300">
                    {technician?.company || 'Technicien indépendant'}
                  </div>
                </div>
              </div>
              
              <div className="mt-5 flex flex-1 flex-col">
                <nav className="px-2 space-y-1">
                  {navItems.map((item) => (
                    <Link 
                      key={item.path} 
                      to={`/technician/${item.path}`}
                      className="group flex items-center px-2 py-2 text-base font-medium rounded-md hover:bg-cream-100 hover:text-brand-600 dark:hover:bg-charcoal-800 dark:hover:text-brand-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.icon}
                      <span className="ml-3">{item.label}</span>
                    </Link>
                  ))}
                </nav>
              </div>
              
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
        <main className="flex-1 overflow-auto bg-cream-100 dark:bg-charcoal-900 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TechnicianLayout;