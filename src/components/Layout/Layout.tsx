import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { SidebarProvider, useSidebar } from '../../contexts/SidebarContext';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

function LayoutContent({ children, title, subtitle }: LayoutProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex h-screen bg-gray-50">
      <div className={`flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function Layout({ children, title, subtitle }: LayoutProps) {
  return (
    <SidebarProvider>
      <LayoutContent title={title} subtitle={subtitle} children={children} />
    </SidebarProvider>
  );
}