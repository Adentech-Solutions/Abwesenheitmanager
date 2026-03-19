'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Download, FileText, BarChart3, PieChart, FileSpreadsheet, Info, ChevronRight, Sparkles, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

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
            toast.success('Bericht erfolgreich generiert');
        } catch (error) {
            console.error('Error downloading report:', error);
            toast.error('Fehler beim Herunterladen des Berichts');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in duration-500">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
                            <BarChart3 className="h-7 w-7 text-primary-600" />
                            Berichte & Export
                        </h1>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                            Analysen und detaillierte Daten-Exporte für die Personalabteilung
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Report Generator */}
                    <Card className="lg:col-span-1 p-8 border-gray-100 shadow-sm animate-in slide-in-from-left-4 duration-500 delay-0">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl border border-primary-100 shadow-sm">
                                <FileSpreadsheet className="h-7 w-7" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase tracking-widest">Konfigurator</h2>
                                <p className="text-xs font-bold text-gray-400">Parameter für Export festlegen</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Berichtstyp</label>
                                <Select
                                    value={reportType}
                                    onChange={(e) => setReportType(e.target.value)}
                                    options={[
                                        { value: 'annual_leave', label: 'Urlaubsübersicht (Resturlaub)' },
                                        { value: 'sick_leave', label: 'Krankheitsstatistik' },
                                    ]}
                                    className="h-11 rounded-xl border-gray-100 font-bold text-gray-700 shadow-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Zeitraum (Jahr)</label>
                                <Select
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    options={[
                                        { value: '2024', label: 'Geschäftsjahr 2024' },
                                        { value: '2025', label: 'Geschäftsjahr 2025' },
                                    ]}
                                    className="h-11 rounded-xl border-gray-100 font-bold text-gray-700 shadow-sm"
                                />
                            </div>

                            <div className="pt-4">
                                <Button
                                    onClick={handleDownload}
                                    isLoading={isGenerating}
                                    className="w-full h-11 rounded-xl font-bold shadow-md shadow-primary-100 bg-primary-600 hover:bg-primary-700"
                                >
                                    {isGenerating ? (
                                        'Generiere Datei...'
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4 mr-2" />
                                            CSV Export starten
                                        </>
                                    )}
                                </Button>
                                <p className="text-[10px] text-center text-gray-400 font-bold mt-4 uppercase tracking-widest leading-relaxed">
                                    Export-Format: CSV (UTF-8) <br/> Kompatibel mit Excel, Numbers & HR-Tools
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Previews / Descriptions */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="p-8 border-gray-100 shadow-sm transition-all hover:shadow-md animate-in slide-in-from-bottom-4 duration-500 delay-150">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                                    <PieChart className="h-6 w-6" />
                                </div>
                                <div className="space-y-2 flex-1">
                                    <h3 className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] flex items-center gap-2">
                                        Fokus: Urlaubs-Compliance <Badge className="bg-emerald-100 text-emerald-800 border-none font-black text-[8px] px-1.5 rounded uppercase">Standard</Badge>
                                    </h3>
                                    <p className="text-sm font-bold text-gray-900 tracking-tight">Urlaubsübersicht & Restansprüche</p>
                                    <p className="text-xs font-bold text-gray-400 leading-relaxed pr-8">
                                        Detaillierter Export aller Mitarbeiter mit absolutem Anspruch, genommenen Tagen im Zeitraum 
                                        und dem aktuellen Saldo. Ideal für die Rückstellungsbildung zum Jahresabschluss.
                                    </p>
                                    <div className="pt-2 flex items-center gap-2 text-emerald-600 text-xs font-black uppercase tracking-widest cursor-pointer hover:underline">
                                        Dokumentation ansehen <ChevronRight className="h-3 w-3" />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-8 border-gray-100 shadow-sm transition-all hover:shadow-md animate-in slide-in-from-bottom-4 duration-500 delay-300">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                                    <Activity className="h-6 w-6" />
                                </div>
                                <div className="space-y-2 flex-1">
                                    <h3 className="text-[10px] font-black text-amber-700 uppercase tracking-[0.2em] flex items-center gap-2">
                                        Fokus: Gesundheitsquote <Badge className="bg-amber-100 text-amber-800 border-none font-black text-[8px] px-1.5 rounded uppercase">Anonymisiert</Badge>
                                    </h3>
                                    <p className="text-sm font-bold text-gray-900 tracking-tight">Krankheitsstatistik & Fehlzeiten</p>
                                    <p className="text-xs font-bold text-gray-400 leading-relaxed pr-8">
                                        Aggregierte Darstellung der Krankheitstage pro Abteilung und Mitarbeiter. 
                                        Enthält keine Diagnosedaten, sondern rein numerische Fehlzeiten für die Personalplanung.
                                    </p>
                                    <div className="pt-2 flex items-center gap-2 text-amber-600 text-xs font-black uppercase tracking-widest cursor-pointer hover:underline">
                                        Privacy-Richtlinien <ChevronRight className="h-3 w-3" />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Pro-Tip section */}
                        <div className="bg-gray-50/50 border border-gray-100 rounded-3xl p-6 flex gap-5 items-center animate-in zoom-in-95 duration-500 delay-500">
                            <div className="h-12 w-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center flex-shrink-0">
                                <Sparkles className="h-6 w-6 text-primary-500" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Wussten Sie schon?</p>
                                <p className="text-[11px] font-medium text-gray-500 leading-relaxed">
                                    Sie können die Berichte direkt in Ihr Personio oder Datev-System importieren. 
                                    Die Spaltenstruktur ist bereits für gängige Lohnbuchhaltungs-Software optimiert.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
