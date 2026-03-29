'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { cn } from "@/lib/utils";
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  delay?: string;
  className?: string;
}

export default function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  color,
  bgColor,
  delay: _delay = 'delay-0',
  className,
}: StatsCardProps) {
  return (
    <Card 
      hover={false}
      className={cn(
        "p-6 border-gray-100 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 tracking-tight">
          {title}
        </h3>
        <div className={cn("p-2 rounded-xl transition-colors", bgColor)}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold text-gray-900 tracking-tight">{value}</div>
        {description && (
          <p className="text-xs text-gray-400 mt-1 font-medium italic">
            {description}
          </p>
        )}
      </div>
    </Card>
  );
}
