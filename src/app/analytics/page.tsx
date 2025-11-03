'use client';

// ========================================
// FILE: src/app/analytics/page.tsx
// Analytics Dashboard Page
// ========================================

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

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
      // Fetch overview analytics
      const monthParam = selectedMonth ? `&month=${selectedMonth}` : '';
      const analyticsRes = await fetch(`/api/analytics?year=${selectedYear}${monthParam}`);
      const analyticsData = await analyticsRes.json();
      setAnalytics(analyticsData.analytics);

      // Fetch department stats
      const deptRes = await fetch(`/api/analytics/departments?year=${selectedYear}${monthParam}`);
      const deptData = await deptRes.json();
      setDepartments(deptData.departments);

      // Fetch sick trends
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
      // Open PDF in new window
      window.open(url, '_blank');
    } else if (format === 'csv') {
      // Download CSV
      window.location.href = url;
    } else if (format === 'excel') {
      // Handle Excel export (requires client-side library)
      const response = await fetch(url);
      const data = await response.json();
      // TODO: Use a library like xlsx to generate Excel file
      console.log('Excel data:', data);
      alert('Excel export: Implementierung mit XLSX-Bibliothek erforderlich');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600">Laden...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Abwesenheits-Statistiken und Trends</p>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              value={selectedMonth || ''}
              onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <div className="text-sm font-medium text-gray-600">Gesamt Abwesenheiten</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">{analytics.totalAbsences}</div>
                <div className="mt-1 text-sm text-gray-500">
                  {analytics.comparedToLastMonth.percentageChange >= 0 ? '↑' : '↓'}
                  {' '}
                  {Math.abs(analytics.comparedToLastMonth.percentageChange)}% vs. Vormonat
                </div>
              </Card>

              <Card>
                <div className="text-sm font-medium text-gray-600">Gesamt Tage</div>
                <div className="mt-2 text-3xl font-bold text-primary-600">{analytics.totalDays}</div>
                <div className="mt-1 text-sm text-gray-500">
                  Ø {analytics.averageDuration} Tage pro Abwesenheit
                </div>
              </Card>

              <Card>
                <div className="text-sm font-medium text-gray-600">Vacation Score</div>
                <div className="mt-2 text-3xl font-bold text-success-600">{analytics.vacationScore}%</div>
                <div className="mt-1 text-sm text-gray-500">
                  {analytics.vacationScore >= 70 ? '✅ Gut' : analytics.vacationScore >= 50 ? '⚠️ Mittel' : '❌ Niedrig'}
                </div>
              </Card>

              <Card>
                <div className="text-sm font-medium text-gray-600">Krankheitstage</div>
                <div className="mt-2 text-3xl font-bold text-warning-600">{analytics.byType.sick}</div>
                <div className="mt-1 text-sm text-gray-500">
                  {analytics.comparedToLastMonth.sickLeaveChange >= 0 ? '↑' : '↓'}
                  {' '}
                  {Math.abs(analytics.comparedToLastMonth.sickLeaveChange)} vs. Vormonat
                </div>
              </Card>
            </div>

            {/* Absence Types */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Abwesenheiten nach Typ</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Urlaub</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${(analytics.byType.vacation / analytics.totalAbsences) * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-900 font-medium w-12 text-right">{analytics.byType.vacation}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Krankheit</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-warning-600 h-2 rounded-full"
                          style={{ width: `${(analytics.byType.sick / analytics.totalAbsences) * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-900 font-medium w-12 text-right">{analytics.byType.sick}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Fortbildung</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-success-600 h-2 rounded-full"
                          style={{ width: `${(analytics.byType.training / analytics.totalAbsences) * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-900 font-medium w-12 text-right">{analytics.byType.training}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Elternzeit</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${(analytics.byType.parental / analytics.totalAbsences) * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-900 font-medium w-12 text-right">{analytics.byType.parental}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Peak Days */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Tage</h3>
                <p className="text-sm text-gray-600 mb-4">Tage mit den meisten Abwesenheiten</p>
                {analytics.peakDays && analytics.peakDays.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.peakDays.map((peak, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">
                          {new Date(peak.date).toLocaleDateString('de-DE', { 
                            weekday: 'short', 
                            day: '2-digit', 
                            month: 'short' 
                          })}
                        </span>
                        <Badge variant="warning">{peak.absenceCount} Abwesende</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Keine Peak-Tage gefunden</p>
                )}
              </Card>
            </div>
          </>
        )}

        {/* Department Stats */}
        {departments.length > 0 && (
          <Card className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Statistik nach Abteilung</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv', 'departments')}
              >
                📥 Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abteilung</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mitarbeiter</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abwesenheiten</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ø Dauer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urlaubsrate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Krankheitsrate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {departments.map((dept, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.employeeCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.totalAbsences}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.totalDays}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.averageDuration} Tage</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.vacationRate}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.sickLeaveRate} Tage/MA</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Sick Trends */}
        {sickTrends.length > 0 && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Krankenstand-Trends</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('pdf', 'sick-trends')}
                >
                  📄 PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('csv', 'sick-trends')}
                >
                  📥 CSV
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {sickTrends.map((trend, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">{trend.month}</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{trend.sickDays}</div>
                  <div className={`text-sm mt-1 ${
                    trend.trend === 'up' ? 'text-danger-600' :
                    trend.trend === 'down' ? 'text-success-600' :
                    'text-gray-600'
                  }`}>
                    {trend.trend === 'up' && '📈 '}
                    {trend.trend === 'down' && '📉 '}
                    {trend.trend === 'stable' && '➡️ '}
                    {trend.percentageChange !== 0 && `${trend.percentageChange > 0 ? '+' : ''}${trend.percentageChange}%`}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Export Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Button variant="primary" onClick={() => handleExport('pdf', 'overview')}>
            📄 Vollständiger PDF Report
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv', 'overview')}>
            📥 CSV Export
          </Button>
        </div>
      </main>
    </div>
  );
}