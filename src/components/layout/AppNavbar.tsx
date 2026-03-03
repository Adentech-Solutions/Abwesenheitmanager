'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  LayoutDashboard, Calendar, FileText, CheckSquare,
  Shield, BarChart2, LogOut, User, ChevronDown,
} from 'lucide-react';
import { clsx } from 'clsx';

// ── SVG Logo — kein Emoji ──────────────────────────────────────────────────
function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="28" rx="8" fill="#2563eb" />
      <path d="M7 14C7 10.134 10.134 7 14 7C17.866 7 21 10.134 21 14" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 14V20" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="14" cy="21" r="1.5" fill="white" />
      <path d="M10 18L14 20L18 18" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AppNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const isManager = userRole === 'manager' || userRole === 'admin';
  const isAdmin = userRole === 'admin';

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Abwesenheiten', href: '/absences', icon: FileText },
    { name: 'Kalender', href: '/calendar', icon: Calendar },
    ...(isManager ? [{ name: 'Genehmigungen', href: '/manager', icon: CheckSquare }] : []),
    ...(isManager ? [{ name: 'Analytics', href: '/analytics', icon: BarChart2 }] : []),
    ...(isAdmin ? [{ name: 'Admin', href: '/admin', icon: Shield }] : []),
  ];

  const getInitials = (name?: string | null) =>
    (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-8">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <Logo />
            <span className="hidden sm:block font-bold text-gray-900 text-sm tracking-tight">
              Absence Manager
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-0.5 flex-1">
            {navLinks.map(({ name, href, icon: Icon }) => {
              const isActive = pathname === href || pathname?.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden md:block">{name}</span>
                </Link>
              );
            })}
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors outline-none">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs bg-primary-100 text-primary-700 font-semibold">
                    {getInitials(session?.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900 leading-tight max-w-[120px] truncate">
                    {session?.user?.name?.split(' ')[0] || 'User'}
                  </span>
                  <span className="text-xs text-gray-400 capitalize">{userRole || 'employee'}</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden sm:block" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-xl p-1.5 shadow-lg border border-gray-200">
              <DropdownMenuLabel className="px-2 py-2">
                <p className="text-sm font-semibold text-gray-900 truncate">{session?.user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-gray-100 my-1" />

              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer text-sm text-gray-700 hover:bg-gray-50">
                  <User className="h-4 w-4 text-gray-400" />
                  Mein Profil
                </Link>
              </DropdownMenuItem>

              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer text-sm text-gray-700 hover:bg-gray-50">
                    <Shield className="h-4 w-4 text-gray-400" />
                    Administration
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator className="bg-gray-100 my-1" />

              <DropdownMenuItem
                onSelect={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer text-sm text-red-600 hover:bg-red-50 focus:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                Abmelden
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </nav>
  );
}