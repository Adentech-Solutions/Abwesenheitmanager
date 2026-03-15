// ========================================
// FILE: src/app/api/analytics/export/route.ts
// Export Analytics API
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import { calculateAnalytics, getAnalyticsByDepartment, getSickLeaveTrends } from '@/lib/services/analyticsService';
import { generateCSV, generateExcelData, generatePDFHtml } from '@/lib/services/exportService';

/**
 * GET /api/analytics/export
 * Export analytics data in various formats
 * 
 * Query params:
 * - format: 'csv' | 'excel' | 'pdf' (required)
 * - type: 'overview' | 'departments' | 'sick-trends' (required)
 * - year: number (default: current year)
 * - month: number (optional)
 * - department: string (optional)
 */
export async function GET(request: NextRequest) {
  try {
    // 🔒 Security: Only managers and admins can export analytics
    await requireRole(['manager', 'admin']);

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') as 'csv' | 'excel' | 'pdf';
    const type = searchParams.get('type') as 'overview' | 'departments' | 'sick-trends';
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const monthParam = searchParams.get('month');
    const month = monthParam ? parseInt(monthParam) : undefined;
    const department = searchParams.get('department') || undefined;

    if (!format || !type) {
      return NextResponse.json(
        { error: 'Missing required parameters: format and type' },
        { status: 400 }
      );
    }

    // Fetch data based on type
    let data: any;
    let title: string;
    let columns: string[] = [];

    switch (type) {
      case 'overview':
        data = await calculateAnalytics({ year, month, department });
        title = `Abwesenheits-Report ${month ? `${month}/` : ''}${year}`;
        if (department) title += ` - ${department}`;
        break;

      case 'departments':
        const deptStats = await getAnalyticsByDepartment(year, month);
        data = deptStats;
        title = `Abteilungs-Statistik ${month ? `${month}/` : ''}${year}`;
        columns = [
          'department',
          'employeeCount',
          'totalAbsences',
          'totalDays',
          'averageDuration',
          'vacationRate',
          'sickLeaveRate',
        ];
        break;

      case 'sick-trends':
        const trends = await getSickLeaveTrends(year, 12);
        data = trends;
        title = 'Krankenstand-Trends';
        columns = ['month', 'year', 'sickDays', 'trend', 'percentageChange'];
        break;

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // Generate export based on format
    switch (format) {
      case 'csv':
        const csvData = Array.isArray(data) ? data : [data];
        const csv = generateCSV(csvData, columns);
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${title}.csv"`,
          },
        });

      case 'excel':
        const excelData = generateExcelData({
          title,
          subtitle: department || '',
          generatedAt: new Date(),
          data: Array.isArray(data) ? data : [data],
          columns,
        });
        return NextResponse.json(excelData);

      case 'pdf':
        const html = generatePDFHtml({
          title,
          subtitle: department || '',
          generatedAt: new Date(),
          data: type === 'overview' ? { analytics: data } : { [type]: data },
          columns,
        });
        return new NextResponse(html, {
          headers: {
            'Content-Type': 'text/html',
          },
        });

      default:
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error exporting analytics:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics' },
      { status: 500 }
    );
  }
}