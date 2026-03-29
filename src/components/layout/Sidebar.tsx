'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  CheckSquare, 
  ShieldCheck, 
  Settings 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[]; // if set, only shown for these roles
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string | undefined;

  const links: SidebarLink[] = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      href: '/absences',
      label: 'Abwesenheiten',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      href: '/calendar',
      label: 'Kalender',
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      href: '/manager',
      label: 'Genehmigungen',
      roles: ['teamlead', 'manager', 'hr_manager', 'admin'],
      icon: <CheckSquare className="w-5 h-5" />,
    },
    {
      href: '/admin',
      label: 'Administration',
      roles: ['hr_manager', 'admin'],
      icon: <ShieldCheck className="w-5 h-5" />,
    },
    {
      href: '/settings',
      label: 'Einstellungen',
      roles: ['admin'],
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const visibleLinks = links.filter(
    (link) => !link.roles || (role && link.roles.includes(role))
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4 space-y-1">
        {visibleLinks.map((link) => {
          const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}