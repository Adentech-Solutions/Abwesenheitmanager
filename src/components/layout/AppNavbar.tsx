'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Wordmark from '@/components/shared/Wordmark';
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
  LayoutDashboard, 
  Calendar, 
  FileText, 
  CheckSquare,
  Shield, 
  BarChart2, 
  LogOut, 
  User, 
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-xl shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-8 justify-between lg:justify-start">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 group transition-transform hover:scale-[1.02] active:scale-95">
            <Wordmark size="sm" />
          </Link>

          {/* Nav links */}
          <div className="hidden lg:flex items-center gap-1 flex-1">
            {navLinks.map(({ name, href, icon: Icon }) => {
              const isActive = pathname === href || pathname?.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 relative group',
                    isActive
                      ? 'text-primary-600 bg-primary-50/50'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  <Icon className={cn(
                    'h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
                    isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-500'
                  )} />
                  <span>{name}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary-600 rounded-t-full scale-100 animate-in fade-in zoom-in-50 duration-300" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 p-1 px-1.5 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all outline-none group active:scale-95">
                <Avatar className="h-9 w-9 border-2 border-white shadow-sm ring-1 ring-gray-100 transition-all group-hover:ring-primary-100">
                  <AvatarFallback className="text-xs bg-gradient-to-br from-primary-500 to-primary-700 text-white font-black">
                    {getInitials(session?.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start mr-1">
                  <span className="text-[13px] font-bold text-gray-900 leading-none mb-0.5 max-w-[120px] truncate tracking-tight">
                    {session?.user?.name?.split(' ')[0] || 'User'}
                  </span>
                  <div className="flex items-center gap-1 leading-none">
                     <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{userRole || 'employee'}</span>
                     {isAdmin && <Sparkles className="h-2.5 w-2.5 text-primary-500" />}
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-gray-300 transition-transform group-data-[state=open]:rotate-180 duration-200" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" sideOffset={10} className="w-64 rounded-2xl p-2 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <DropdownMenuLabel className="px-3 py-3">
                <div className="flex items-center gap-3">
                   <Avatar className="h-10 w-10 border border-gray-100">
                      <AvatarFallback className="text-sm bg-primary-50 text-primary-600 font-bold">
                        {getInitials(session?.user?.name)}
                      </AvatarFallback>
                   </Avatar>
                   <div className="flex flex-col min-w-0">
                      <p className="text-sm font-black text-gray-900 truncate tracking-tight leading-none mb-1">{session?.user?.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 truncate tracking-tight">{session?.user?.email}</p>
                   </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="mx-2 my-2 bg-gray-50" />

              <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 cursor-pointer focus:bg-primary-50 focus:text-primary-700 transition-colors">
                <Link href="/profile" className="flex items-center gap-3 w-full">
                  <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400 group-hover:text-primary-600">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-sm tracking-tight text-gray-600 focus:text-primary-700">Mein Profil</span>
                </Link>
              </DropdownMenuItem>

              {isAdmin && (
                <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 cursor-pointer focus:bg-primary-50 focus:text-primary-700 transition-colors">
                  <Link href="/admin" className="flex items-center gap-3 w-full">
                    <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400">
                      <Shield className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-sm tracking-tight text-gray-600">Administration</span>
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator className="mx-2 my-2 bg-gray-50" />

              <DropdownMenuItem
                onSelect={() => signOut({ callbackUrl: '/' })}
                className="rounded-xl px-3 py-2.5 cursor-pointer text-rose-500 focus:bg-rose-50 focus:text-rose-600 transition-colors group"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-1.5 bg-rose-50/50 rounded-lg text-rose-400 group-hover:text-rose-500 transition-colors">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-sm tracking-tight">Abmelden</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </nav>
  );
}