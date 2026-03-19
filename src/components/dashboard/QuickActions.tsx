'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Palmtree, Stethoscope, BookOpen, Plus, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      label: 'Urlaub beantragen',
      icon: Palmtree,
      onClick: () => router.push('/absences/new'),
      variant: 'primary' as const,
      description: 'Erholungsurlaub planen',
      colorClass: 'text-primary-600 bg-primary-50',
    },
    {
      label: 'Krankmeldung',
      icon: Stethoscope,
      onClick: () => router.push('/absences/new?type=sick'),
      variant: 'danger' as const,
      description: 'Arbeitsunfähigkeit melden',
      colorClass: 'text-red-600 bg-red-50',
    },
    {
      label: 'Fortbildung',
      icon: BookOpen,
      onClick: () => router.push('/absences/new?type=training'),
      variant: 'info' as const,
      description: 'Weiterbildung beantragen',
      colorClass: 'text-blue-600 bg-blue-50',
    },
  ];

  return (
    <Card className="overflow-hidden hover:shadow-md transition-all">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-2 text-gray-900">
          <Plus className="h-5 w-5 text-primary-600" />
          Schnellaktionen
        </CardTitle>
        <p className="text-sm text-gray-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Was möchtest du tun?</p>
      </CardHeader>
      
      <CardContent className="grid grid-cols-1 gap-3">
        {actions.map((action, index) => (
          <Button
            key={action.label}
            variant="outline"
            onClick={action.onClick}
            className={cn(
              "group h-auto p-4 justify-between border-gray-100 hover:border-primary-200 hover:bg-primary-50/10 rounded-2xl transition-all animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both",
              `delay-[${index * 100}ms]`
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", action.colorClass)}>
                <action.icon className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900 group-hover:text-primary-700 transition-colors uppercase tracking-tight text-[10px]">
                  {action.label}
                </p>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                  {action.description}
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}