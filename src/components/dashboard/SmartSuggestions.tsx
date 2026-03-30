// src/components/dashboard/SmartSuggestions.tsx
// Modul 2: Proaktives Urlaubs-Widget

'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Sparkles, 
  Users, 
  Calendar, 
  Heart, 
  Clock, 
  Plus, 
  ArrowRight,
  Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ProactiveSuggestion } from '@/lib/services/proactiveSuggestions';

interface SmartSuggestionsProps {
  className?: string;
}

export default function SmartSuggestions({ className }: SmartSuggestionsProps) {
  const { data, isLoading, error } = useQuery<{ suggestion: ProactiveSuggestion | null }>({
    queryKey: ['proactive-suggestions'],
    queryFn: async () => {
      const res = await fetch('/api/smart-suggestions');
      if (!res.ok) throw new Error('Failed to fetch suggestions');
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 Minuten
  });

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden animate-pulse", className)}>
        <CardHeader className="pb-2">
          <div className="h-5 w-40 bg-gray-200 rounded" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-8 w-full bg-gray-200 rounded" />
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-gray-100 rounded-full" />
            <div className="h-6 w-20 bg-gray-100 rounded-full" />
          </div>
          <div className="h-10 w-full bg-gray-200 rounded pt-2" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.suggestion) {
    return (
      <Card className={cn("overflow-hidden border-dashed bg-gray-50/50", className)}>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="p-3 rounded-full bg-white shadow-sm mb-4">
            <Sparkles className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900">Alles gut — kein Handlungsbedarf gerade.</p>
          <p className="text-xs text-gray-500 mt-1">Die nächste Empfehlung kommt wenn sich etwas ändert.</p>
        </CardContent>
      </Card>
    );
  }

  const { suggestion } = data;

  // Signal Map for Icons
  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'teamAvailable': return <Users className="h-3 w-3 mr-1" />;
      case 'holidayNearby': return <Calendar className="h-3 w-3 mr-1" />;
      case 'needsRecovery': return <Heart className="h-3 w-3 mr-1" />;
      case 'calendarFree': return <Clock className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  // Badge Styles Map
  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'teamAvailable': return "bg-success-100 text-success-800 border-success-200 hover:bg-success-200";
      case 'holidayNearby': return "bg-primary-100 text-primary-800 border-primary-200 hover:bg-primary-200";
      case 'needsRecovery': return "bg-warning-100 text-warning-800 border-warning-200 hover:bg-warning-200";
      case 'calendarFree': return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200";
      default: return "";
    }
  };

  return (
    <Card className={cn("relative overflow-hidden transition-all hover:shadow-md", className)}>
      {/* Visual Indicator: Score Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full bg-primary-50 opacity-50 blur-2xl" />
      
      <CardHeader className="pb-2 relative">
        <div className="flex items-center gap-2 text-primary-600 mb-1">
          <Sparkles className="h-4 w-4 fill-primary-600" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Smart Suggestion</span>
        </div>
        <CardTitle className="text-lg font-bold text-gray-900 leading-tight">
          {suggestion.headline}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 relative">
        <p className="text-sm text-gray-600 leading-relaxed">
          {suggestion.reason}
        </p>

        {/* Dynamic Badges */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(suggestion.signals).map(([key, sig]) => {
            if (!sig.active) return null;
            return (
              <Badge 
                key={key} 
                variant="outline" 
                className={cn("px-2 py-0.5 text-[10px] flex items-center transition-colors", getBadgeStyle(key))}
              >
                {getSignalIcon(key)}
                {suggestion.badges.find(b => b.includes(sig.data?.badge || b)) || sig.message.split('—')[0].trim()}
              </Badge>
            );
          })}
        </div>

        {/* Efficiency Stats */}
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 uppercase font-medium">Freie Tage</span>
              <span className="text-sm font-bold text-success-600">{suggestion.freieTage} Tage</span>
            </div>
            <div className="w-px h-6 bg-gray-200" />
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 uppercase font-medium">Urlaubstage</span>
              <span className="text-sm font-bold text-gray-900">{suggestion.urlaubstage}</span>
            </div>
          </div>
          
          {/* Subtle Score Circle */}
          <div className="h-8 w-8 rounded-full border-2 border-primary-100 flex items-center justify-center bg-white" title={`Empfehlungs-Score: ${suggestion.score}/100`}>
             <span className="text-[10px] font-bold text-primary-600">{suggestion.score}</span>
          </div>
        </div>

        {/* CTA */}
        <Link 
          href={`/absences/new?type=vacation&start=${suggestion.startDate}&end=${suggestion.endDate}`}
          className="block group"
        >
          <Button className="w-full justify-between h-10 px-4 group-hover:shadow-sm" variant="default">
            <span>Urlaub beantragen</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
        
        <p className="text-center text-[10px] text-gray-400 flex items-center justify-center gap-1">
          <Info className="h-3 w-3" />
          Resturlaub danach: <span className="font-semibold text-gray-600">{(suggestion as any).remainingAfter || '--'} Tage</span>
        </p>
      </CardContent>
    </Card>
  );
}
