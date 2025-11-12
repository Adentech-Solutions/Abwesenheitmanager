'use client';

import React from 'react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export default function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Absence Manager</h3>
            <p className="text-sm text-gray-600">
              Moderne Urlaubsverwaltung für Ihr Unternehmen
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">Navigation</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/dashboard" className="hover:text-primary-600 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/calendar" className="hover:text-primary-600 transition-colors">
                  Kalender
                </Link>
              </li>
              <li>
                <Link href="/absences" className="hover:text-primary-600 transition-colors">
                  Abwesenheiten
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">Support</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/help" className="hover:text-primary-600 transition-colors">
                  Hilfe
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-primary-600 transition-colors">
                  Dokumentation
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary-600 transition-colors">
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">Rechtliches</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/privacy" className="hover:text-primary-600 transition-colors">
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary-600 transition-colors">
                  AGB
                </Link>
              </li>
              <li>
                <Link href="/imprint" className="hover:text-primary-600 transition-colors">
                  Impressum
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
          <p>© {currentYear} Absence Manager. Alle Rechte vorbehalten.</p>
          <p className="text-xs">
            Version 1.0.0 | Made with ❤️ in Germany
          </p>
        </div>
      </div>
    </footer>
  );
}
