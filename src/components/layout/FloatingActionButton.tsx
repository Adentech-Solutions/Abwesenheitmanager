'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Plus, Calendar, AlertCircle, BookOpen, Baby } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';

export default function FloatingActionButton() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const actions = [
    {
      label: 'Urlaub',
      icon: Calendar,
      color: 'bg-blue-500 hover:bg-blue-600',
      type: 'vacation',
    },
    {
      label: 'Krankheit',
      icon: AlertCircle,
      color: 'bg-red-500 hover:bg-red-600',
      type: 'sick',
    },
    {
      label: 'Fortbildung',
      icon: BookOpen,
      color: 'bg-green-500 hover:bg-green-600',
      type: 'training',
    },
    {
      label: 'Elternzeit',
      icon: Baby,
      color: 'bg-purple-500 hover:bg-purple-600',
      type: 'parental',
    },
  ];

  const handleAction = (type: string) => {
    setMenuOpen(false);
    // Navigate to form page
    router.push(`/absences/new?type=${type}`);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-50">
        {/* Mini Menu (appears when FAB is clicked) */}
        {menuOpen && (
          <div className="absolute bottom-20 right-0 space-y-2 mb-2">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.type}
                  className="flex items-center gap-3 animate-in slide-in-from-bottom duration-200"
                >
                  <span className="text-sm font-medium bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
                    {action.label}
                  </span>
                  <button
                    className={clsx(
                      'h-12 w-12 rounded-full shadow-lg flex items-center justify-center text-white transition-colors',
                      action.color
                    )}
                    onClick={() => handleAction(action.type)}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Main FAB Button */}
        <button
          className={clsx(
            'h-16 w-16 rounded-full shadow-2xl transition-all flex items-center justify-center text-white',
            menuOpen
              ? 'rotate-45 bg-red-600 hover:bg-red-700'
              : 'bg-primary-600 hover:bg-primary-700'
          )}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Plus className="h-8 w-8" />
        </button>
      </div>

      {/* Sheet for Absence Form (placeholder) */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle>Neuer Antrag</SheetTitle>
            <SheetDescription>
              Erstelle einen neuen Abwesenheitsantrag
            </SheetDescription>
          </SheetHeader>
          {/* Form wird hier später integriert */}
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Formular wird geladen...
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
