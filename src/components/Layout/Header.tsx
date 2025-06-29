import React from 'react';
import { Hotel, ChevronDown, Menu, X } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <div className="bg-white border-b border-warm-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Bouton de toggle de la sidebar */}
          <button
            onClick={toggleSidebar}
            className="p-2 text-warm-600 hover:text-warm-800 hover:bg-warm-100 rounded-lg transition-colors"
            title={isCollapsed ? 'Étendre le menu' : 'Réduire le menu'}
          >
            {isCollapsed ? (
              <Menu className="w-5 h-5" />
            ) : (
              <X className="w-5 h-5" />
            )}
          </button>
          
          <div>
            <h1 className="text-2xl font-bold text-warm-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-warm-600 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 px-4 py-2 bg-creho-50 text-creho-700 rounded-lg hover:bg-creho-100 transition-colors">
            <Hotel className="w-4 h-4" />
            <span className="text-sm font-medium">Tous les hôtels</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}