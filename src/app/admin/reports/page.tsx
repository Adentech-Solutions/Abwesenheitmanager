'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { Download, FileText } from 'lucide-react';

export default function ReportsPage() {
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [reportType, setReportType] = useState('annual_leave');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch(`/api/admin/reports?year=${year}&type=${reportType}`);
            if (!response.ok) throw new Error('Failed to generate report');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_${reportType}_${year}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading report:', error);
            alert('Fehler beim Herunterladen des Berichts');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Berichte & Export</h1>
                    <p className="text-gray-600">Generieren Sie detaillierte Berichte für die Personalabteilung</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">Bericht generieren</h2>
                                <p className="text-sm text-gray-500">Wählen Sie Typ und Zeitraum</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Select
                                label="Berichtstyp"
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                options={[
                                    { value: 'annual_leave', label: 'Urlaubsübersicht (Resturlaub)' },
                                    { value: 'sick_leave', label: 'Krankheitsstatistik' },
                                ]}
                            />

                            <Select
                                label="Jahr"
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                options={[
                                    { value: '2024', label: '2024' },
                                    { value: '2025', label: '2025' },
                                ]}
                            />

                            <div className="pt-4">
                                <Button
                                    onClick={handleDownload}
                                    isLoading={isGenerating}
                                    className="w-full"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    CSV Herunterladen
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-lg font-semibold mb-4">Verfügbare Berichte</h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h3 className="font-medium text-gray-900">Urlaubsübersicht</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Enthält eine Liste aller Mitarbeiter mit ihrem Urlaubsanspruch, genommenen Tagen und Resturlaub.
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h3 className="font-medium text-gray-900">Krankheitsstatistik</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Aggregierte Krankheitstage pro Mitarbeiter für das ausgewählte Jahr.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
