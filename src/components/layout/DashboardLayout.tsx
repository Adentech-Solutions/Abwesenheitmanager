'use client';

import React from 'react';
import AppNavbar from './AppNavbar';
import AppFooter from './AppFooter';
import FloatingActionButton from './FloatingActionButton';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AppNavbar />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <AppFooter />
      
      <FloatingActionButton />
    </div>
  );
}
