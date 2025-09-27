'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { Toaster } from 'sonner';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';
import AppFooter from './AppFooter';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <AppHeader />
      
      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Sidebar - только для авторизованных пользователей */}
        {session && <AppSidebar />}
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          <div className="flex-1">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </div>
          </div>
          
          {/* Footer */}
          <AppFooter />
        </main>
      </div>
      
      {/* Toast Notifications */}
      <Toaster position="top-right" />
    </div>
  );
}
