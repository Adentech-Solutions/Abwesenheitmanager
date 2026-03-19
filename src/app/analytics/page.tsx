'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import StatsCard from '@/components/shared/StatsCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Users, 
  Building2, 
  FileText, 
  Download, 
  FilePieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Analytics {
  totalAbsences: number;
  totalDays: number;
  averageDuration: number;
  vacationScore: number;
  byType: {
    vacation: number;
    sick: number;
    training: number;
    parental: number;
  };
  comparedToLastMonth: {
    totalChange: number;
    percentageChange: number;
    sickLeaveChange: number;
  };
  peakDays: Array<{
    date: string;
    absenceCount: number;
  }>;
}

interface DepartmentStat {
  department: string;
  totalAbsences: number;
  totalDays: number;
  averageDuration: number;
  vacationRate: number;
  sickLeaveRate: number;
  employeeCount: number;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [departments, setDepartments] = useState<DepartmentStat[]>([]);
  const [sickTrends, setSickTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedYear, selectedMonth]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const monthParam = selectedMonth ? `&month=${selectedMonth}` : '';
      const analyticsRes = await fetch(`/api/analytics?year=${selectedYear}${monthParam}`);
      const analyticsData = await analyticsRes.json();
      setAnalytics(analyticsData.analytics);

      const deptRes = await fetch(`/api/analytics/departments?year=${selectedYear}${monthParam}`);
      const deptData = await deptRes.json();
      setDepartments(deptData.departments);

      const trendsRes = await fetch(`/api/analytics/sick-trends?year=${selectedYear}&months=6`);
      const trendsData = await trendsRes.json();
      setSickTrends(trendsData.trends);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf', type: string) => {
    const monthParam = selectedMonth ? `&month=${selectedMonth}` : '';
    const url = `/api/analytics/export?format=${format}&type=${type}&year=${selectedYear}${monthParam}`;

    if (format === 'pdf') {
      window.open(url, '_blank');
    } else if (format === 'csv') {
      window.location.href = url;
    } else if (format === 'excel') {
      alert('Excel export: Implementierung mit XLSX-Bibliothek erforderlich');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-[60vh] flex items-center justify-center">
          <LoadingSpinner text="Analysen werden aufbereitet..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
              <BarChart3 className="h-7 w-7 text-primary-600" />
              Analytics Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">Abwesenheits-Statistiken, Trends und Kapazitätsplanung</p>
          </div>
          
          <div className="flex gap-2 p-1.5 bg-gray-100/50 rounded-2xl border border-gray-100 shadow-sm backdrop-blur-sm">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-white border-none rounded-xl text-sm font-bold px-4 py-2 ring-1 ring-gray-200 focus:ring-2 focus:ring-primary-500 transition-all outline-none"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              value={selectedMonth || ''}
              onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)}
              className="bg-white border-none rounded-xl text-sm font-bold px-4 py-2 ring-1 ring-gray-200 focus:ring-2 focus:ring-primary-500 transition-all outline-none"
            >
              <option value="">Gesamtes Jahr</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>
                  {new Date(2000, month - 1).toLocaleDateString('de-DE', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard 
              title="Gesamt Abwesenheiten" 
              value={analytics.totalAbsences} 
              icon={Activity} 
              color="text-gray-900" 
              bgColor="bg-gray-50"
              description={`${analytics.comparedToLastMonth.percentageChange >= 0 ? '+' : ''}${analytics.comparedToLastMonth.percentageChange}% vs. Vormonat`}
              delay="delay-0"
            />
            <StatsCard 
              title="Gesamt Tage" 
              value={analytics.totalDays} 
              icon={Calendar} 
              color="text-primary-600" 
              bgColor="bg-primary-50"
              description={`Ø ${analytics.averageDuration} Tage / Fall`}
              delay="delay-75"
            />
            <StatsCard 
              title="Vacation Score" 
              value={`${analytics.vacationScore}%`} 
              icon={FilePieChart} 
              color="text-emerald-600" 
              bgColor="bg-emerald-50"
              description={analytics.vacationScore >= 70 ? 'Optimales Niveau' : 'Handlungsbedarf'}
              delay="delay-150"
            />
            <StatsCard 
              title="Krankheitstage" 
              value={analytics.byType.sick} 
              icon={TrendingUp} 
              color="text-rose-600" 
              bgColor="bg-rose-50"
              description={`${analytics.comparedToLastMonth.sickLeaveChange >= 0 ? '+' : ''}${analytics.comparedToLastMonth.sickLeaveChange} vs. Vormonat`}
              delay="delay-[225ms]"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Absence Types Progress */}
          <Card className="lg:col-span-2 p-6 hover:shadow-md transition-all border-gray-100">
            <div className="flex items-center justify-between mb-8 cursor-default">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <FilePieChart className="h-5 w-5 text-primary-600" />
                Abwesenheiten nach Typ
              </h3>
              <Badge variant="outline" className="font-bold border-gray-100 text-gray-400">Verteilung</Badge>
            </div>
            
            <div className="space-y-6">
              {[
                { label: 'Urlaub', count: analytics?.byType.vacation || 0, color: 'bg-primary-500', icon: Calendar },
                { label: 'Krankheit', count: analytics?.byType.sick || 0, color: 'bg-rose-500', icon: TrendingDown },
                { label: 'Fortbildung', count: analytics?.byType.training || 0, color: 'bg-emerald-500', icon: Building2 },
                { label: 'Elternzeit', count: analytics?.byType.parental || 0, color: 'bg-amber-500', icon: Users },
              ].map((item, idx) => {
                const percentage = analytics?.totalAbsences ? (item.count / analytics.totalAbsences) * 100 : 0;
                return (
                  <div key={item.label} className={cn("group animate-in fade-in slide-in-from-left-4 fill-mode-both", `delay-[${idx * 50}ms]`)}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-1.5 rounded-lg bg-gray-50 text-gray-400 group-hover:text-primary-600 transition-colors")}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-bold text-gray-700">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400">{Math.round(percentage)}%</span>
                        <span className="text-sm font-black text-gray-900 w-8 text-right">{item.count}</span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner ring-1 ring-gray-100">
                      <div
                        className={cn("h-full rounded-full transition-all duration-1000 ease-out", item.color)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Peak Days Sidebar */}
          <Card className="p-6 hover:shadow-md transition-all border-gray-100 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary-600" />
                Peak Tage
              </h3>
            </div>
            <p className="text-xs text-gray-500 font-medium mb-4">Tage mit der höchsten Abwesenheitsrate</p>
            
            <div className="space-y-3 flex-1">
              {analytics?.peakDays && analytics.peakDays.length > 0 ? (
                analytics.peakDays.map((peak, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "flex justify-between items-center p-3 bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-sm rounded-xl transition-all group animate-in fade-in slide-in-from-right-4 fill-mode-both",
                      `delay-[${index * 30}ms]`
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-white rounded-lg border border-gray-100 flex flex-col items-center justify-center shadow-xs">
                        <span className="text-[10px] font-bold text-primary-600 leading-none">
                          {new Date(peak.date).toLocaleDateString('de-DE', { month: 'short' }).toUpperCase()}
                        </span>
                        <span className="text-sm font-black text-gray-900 leading-tight">
                          {new Date(peak.date).toLocaleDateString('de-DE', { day: '2-digit' })}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">
                        {new Date(peak.date).toLocaleDateString('de-DE', { weekday: 'long' })}
                      </span>
                    </div>
                    <Badge variant="warning" className="font-bold text-[10px] uppercase px-2 py-0.5">
                      {peak.absenceCount} MA
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <Calendar className="h-10 w-10 mb-2" />
                  <p className="text-xs font-bold">Keine Peaks</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Department Stats Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2 px-1">
              <Building2 className="h-5 w-5 text-primary-600" />
              Statistik nach Abteilung
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv', 'departments')}
              className="bg-white hover:bg-gray-50 text-xs font-bold shadow-sm"
            >
              <Download className="h-3.5 w-3.5 mr-2" />
              Export CSV
            </Button>
          </div>
          
          <Card className="p-0 overflow-hidden hover:shadow-md transition-shadow border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Abteilung</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mitarbeiter</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Abw.</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Tage</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ø Dauer</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Urlaubsrate</th>
                    <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Krank / MA</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {departments.map((dept, index) => (
                    <tr 
                      key={index} 
                      className={cn(
                        "hover:bg-gray-50/50 transition-colors animate-in fade-in slide-in-from-bottom-2 fill-mode-both",
                        `delay-[${index * 20}ms]`
                      )}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center text-[10px] font-black shadow-xs ring-1 ring-primary-100">
                            {dept.department.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-gray-900 tracking-tight">{dept.department}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">{dept.employeeCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold text-center">{dept.totalAbsences}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-primary-600 text-center">{dept.totalDays}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-600">
                        <Badge variant="outline" className="bg-white border-gray-100 font-bold">{dept.averageDuration} Tage</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                           <div className="w-12 bg-gray-100 rounded-full h-1.5 shadow-inner">
                              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${dept.vacationRate}%` }} />
                           </div>
                           <span className="text-xs font-black text-emerald-600">{dept.vacationRate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={cn(
                          "text-sm font-black px-3 py-1 rounded-lg",
                          dept.sickLeaveRate > 5 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                        )}>
                          {dept.sickLeaveRate}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Sick Trends Charts Mockup-ish Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2 px-1">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              Krankenstand-Trends
            </h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => handleExport('pdf', 'sick-trends')} className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-rose-600">
                <FileText className="h-3 w-3 mr-1.5" /> PDF Report
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {sickTrends.map((trend, index) => (
              <Card 
                key={index} 
                className={cn(
                  "p-4 hover:shadow-md transition-all border-gray-100 group animate-in fade-in zoom-in-95 fill-mode-both",
                  `delay-[${index * 30}ms]`
                )}
              >
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3 group-hover:text-primary-600 transition-colors">{trend.month}</div>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-black text-gray-900 tracking-tighter">{trend.sickDays}</div>
                  <div className={cn(
                    "flex items-center p-1 rounded-lg text-[10px] font-bold",
                    trend.trend === 'up' ? "bg-rose-50 text-rose-600" : 
                    trend.trend === 'down' ? "bg-emerald-50 text-emerald-600" : 
                    "bg-gray-50 text-gray-400"
                  )}>
                    {trend.trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : 
                     trend.trend === 'down' ? <ArrowDownRight className="h-3 w-3" /> : 
                     <Minus className="h-3 w-3" />}
                    {trend.percentageChange !== 0 && `${Math.abs(trend.percentageChange)}%`}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10">
          <Button variant="primary" size="lg" onClick={() => handleExport('pdf', 'overview')} className="w-full sm:w-auto h-12 px-10 rounded-2xl shadow-lg hover:shadow-primary-200 transition-all font-bold">
            <FileText className="h-5 w-5 mr-3" />
            Vollständiger PDF Report
          </Button>
          <Button variant="outline" size="lg" onClick={() => handleExport('csv', 'overview')} className="w-full sm:w-auto h-12 px-10 rounded-2xl bg-white border-gray-200 text-gray-700 hover:bg-gray-50 transition-all font-bold">
            <Download className="h-5 w-5 mr-3" />
            Vollständiger Daten-Export
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}