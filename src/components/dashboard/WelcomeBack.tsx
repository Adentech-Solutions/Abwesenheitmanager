'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function WelcomeBack() {
    const [recentAbsences, setRecentAbsences] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Quick fetch of user's own past absences to see if any have a return summary
    useEffect(() => {
        fetch('/api/absences/stats') // We will use existing stats endpoint or just fetch absences
            .then(res => res.json())
            .then(() => fetch('/api/absences')) // Fallback to fetching all absences to filter
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const now = new Date();
                    // Look for absences that ended in the last 7 days and have a return summary
                    const pastWeek = new Date();
                    pastWeek.setDate(now.getDate() - 7);

                    const recent = data.filter((a: any) => {
                        if (!a.handover?.returnSummary?.content) return false;
                        const end = new Date(a.endDate);
                        return end < now && end >= pastWeek;
                    });
                    setRecentAbsences(recent);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading || recentAbsences.length === 0) return null;

    return (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 shadow-sm border border-emerald-100 mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                <span>🎉</span> Willkommen zurück!
            </h2>

            <div className="space-y-4">
                {recentAbsences.map(absence => (
                    <div key={absence._id} className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-white/40 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-sm font-medium text-emerald-600 mb-1">
                                    Ihre Vertretung ({absence.substitute?.name}) hat eine Zusammenfassung hinterlassen:
                                </p>
                                <p className="text-xs text-slate-500">
                                    Für Ihre Abwesenheit vom {new Date(absence.startDate).toLocaleDateString('de-DE')} bis {new Date(absence.endDate).toLocaleDateString('de-DE')}
                                </p>
                            </div>
                            <Link href={`/handover/${absence._id}`} className="text-sm font-medium text-teal-700 hover:text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ml-4">
                                Details ansehen
                            </Link>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 italic text-slate-700 text-sm whitespace-pre-wrap">
                            "{absence.handover.returnSummary.content}"
                        </div>
                    </div>
                ))}
            </div>
        </div >
    );
}
