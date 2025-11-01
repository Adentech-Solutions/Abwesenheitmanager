'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Administration</h1>
        <Card>
          <h2 className="text-xl font-semibold mb-4">Admin-Funktionen</h2>
          <p className="text-gray-600">
            Admin-Features wie Vorlagen-Verwaltung, Betriebsferien und User-Management
            können hier implementiert werden.
          </p>
        </Card>
      </main>
    </div>
  );
}