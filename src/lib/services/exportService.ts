// ========================================
// FILE: src/lib/services/exportService.ts
// Export Service for PDF and Excel Reports
// ========================================

import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export interface ExportData {
  title: string;
  subtitle?: string;
  generatedAt: Date;
  data: any;
  columns?: string[];
}

/**
 * Generate CSV from analytics data
 */
export function generateCSV(data: any[], columns: string[]): string {
  const headers = columns.join(',');
  const rows = data.map(row => 
    columns.map(col => {
      const value = row[col];
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );

  return [headers, ...rows].join('\n');
}

/**
 * Generate Excel-compatible data (as JSON for client-side processing)
 */
export function generateExcelData(exportData: ExportData) {
  return {
    sheets: [
      {
        name: 'Abwesenheits-Report',
        data: [
          // Header rows
          [exportData.title],
          [exportData.subtitle || ''],
          ['Erstellt am:', format(exportData.generatedAt, 'dd.MM.yyyy HH:mm', { locale: de })],
          [], // Empty row
          // Column headers
          exportData.columns || Object.keys(exportData.data[0] || {}),
          // Data rows
          ...exportData.data.map((row: any) => 
            (exportData.columns || Object.keys(row)).map(col => row[col])
          ),
        ],
      },
    ],
  };
}

/**
 * Generate HTML for PDF conversion (client-side)
 */
export function generatePDFHtml(exportData: ExportData): string {
  const { title, subtitle, generatedAt, data } = exportData;

  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page {
      margin: 2cm;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      color: #2563eb;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 10px;
      margin-bottom: 10px;
      font-size: 24pt;
    }
    h2 {
      color: #64748b;
      font-size: 14pt;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    .meta {
      color: #64748b;
      font-size: 10pt;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    thead {
      background: #f1f5f9;
    }
    th {
      text-align: left;
      padding: 12px;
      font-weight: 600;
      color: #1e293b;
      border-bottom: 2px solid #e2e8f0;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    tr:hover {
      background: #f8fafc;
    }
    .stat-card {
      display: inline-block;
      background: #f1f5f9;
      padding: 15px 20px;
      margin: 10px 10px 10px 0;
      border-radius: 8px;
      min-width: 150px;
    }
    .stat-label {
      font-size: 10pt;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-value {
      font-size: 24pt;
      font-weight: bold;
      color: #2563eb;
      margin-top: 5px;
    }
    .trend-up {
      color: #22c55e;
    }
    .trend-down {
      color: #ef4444;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 9pt;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${subtitle ? `<h2>${subtitle}</h2>` : ''}
  <div class="meta">
    Erstellt am: ${format(generatedAt, 'dd. MMMM yyyy, HH:mm', { locale: de })} Uhr
  </div>

  ${generatePDFContent(data)}

  <div class="footer">
    Absence Management System | Vertraulich
  </div>
</body>
</html>
  `;
}

function generatePDFContent(data: any): string {
  if (data.analytics) {
    return generateAnalyticsPDFContent(data.analytics);
  } else if (data.departments) {
    return generateDepartmentsPDFContent(data.departments);
  } else if (data.trends) {
    return generateTrendsPDFContent(data.trends);
  }
  return '<p>Keine Daten verfügbar</p>';
}

function generateAnalyticsPDFContent(analytics: any): string {
  return `
    <div>
      <div class="stat-card">
        <div class="stat-label">Gesamt Abwesenheiten</div>
        <div class="stat-value">${analytics.totalAbsences}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Gesamt Tage</div>
        <div class="stat-value">${analytics.totalDays}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Durchschnitt</div>
        <div class="stat-value">${analytics.averageDuration} Tage</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Vacation Score</div>
        <div class="stat-value">${analytics.vacationScore}%</div>
      </div>
    </div>

    <h2>Nach Typ</h2>
    <table>
      <thead>
        <tr>
          <th>Typ</th>
          <th>Anzahl</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Urlaub</td>
          <td>${analytics.byType.vacation}</td>
        </tr>
        <tr>
          <td>Krankheit</td>
          <td>${analytics.byType.sick}</td>
        </tr>
        <tr>
          <td>Fortbildung</td>
          <td>${analytics.byType.training}</td>
        </tr>
        <tr>
          <td>Elternzeit</td>
          <td>${analytics.byType.parental}</td>
        </tr>
      </tbody>
    </table>

    <h2>Vergleich zum Vormonat</h2>
    <table>
      <thead>
        <tr>
          <th>Metrik</th>
          <th>Änderung</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Gesamt Abwesenheiten</td>
          <td class="${analytics.comparedToLastMonth.totalChange >= 0 ? 'trend-up' : 'trend-down'}">
            ${analytics.comparedToLastMonth.totalChange >= 0 ? '+' : ''}${analytics.comparedToLastMonth.totalChange}
            (${analytics.comparedToLastMonth.percentageChange}%)
          </td>
        </tr>
        <tr>
          <td>Krankmeldungen</td>
          <td class="${analytics.comparedToLastMonth.sickLeaveChange >= 0 ? 'trend-up' : 'trend-down'}">
            ${analytics.comparedToLastMonth.sickLeaveChange >= 0 ? '+' : ''}${analytics.comparedToLastMonth.sickLeaveChange}
          </td>
        </tr>
      </tbody>
    </table>

    ${analytics.peakDays && analytics.peakDays.length > 0 ? `
      <h2>Peak Tage (meiste Abwesenheiten)</h2>
      <table>
        <thead>
          <tr>
            <th>Datum</th>
            <th>Anzahl Abwesende</th>
          </tr>
        </thead>
        <tbody>
          ${analytics.peakDays.map((peak: any) => `
            <tr>
              <td>${format(new Date(peak.date), 'dd.MM.yyyy', { locale: de })}</td>
              <td>${peak.absenceCount}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : ''}
  `;
}

function generateDepartmentsPDFContent(departments: any[]): string {
  return `
    <table>
      <thead>
        <tr>
          <th>Abteilung</th>
          <th>Mitarbeiter</th>
          <th>Abwesenheiten</th>
          <th>Gesamt Tage</th>
          <th>Ø Dauer</th>
          <th>Urlaubsrate</th>
          <th>Krankheitsrate</th>
        </tr>
      </thead>
      <tbody>
        ${departments.map(dept => `
          <tr>
            <td>${dept.department}</td>
            <td>${dept.employeeCount}</td>
            <td>${dept.totalAbsences}</td>
            <td>${dept.totalDays}</td>
            <td>${dept.averageDuration} Tage</td>
            <td>${dept.vacationRate}%</td>
            <td>${dept.sickLeaveRate} Tage/MA</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function generateTrendsPDFContent(trends: any[]): string {
  return `
    <table>
      <thead>
        <tr>
          <th>Monat</th>
          <th>Krankheitstage</th>
          <th>Trend</th>
          <th>Änderung</th>
        </tr>
      </thead>
      <tbody>
        ${trends.map(trend => `
          <tr>
            <td>${trend.month} ${trend.year}</td>
            <td>${trend.sickDays}</td>
            <td>
              ${trend.trend === 'up' ? '📈' : trend.trend === 'down' ? '📉' : '➡️'}
              ${trend.trend === 'up' ? 'Steigend' : trend.trend === 'down' ? 'Fallend' : 'Stabil'}
            </td>
            <td class="${trend.percentageChange >= 0 ? 'trend-up' : 'trend-down'}">
              ${trend.percentageChange >= 0 ? '+' : ''}${trend.percentageChange}%
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}