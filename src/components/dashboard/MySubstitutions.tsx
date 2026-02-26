'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MySubstitutions() {
    const [active, setActive] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/handover/my-substitutions')
            .then(res => res.json())
            .then(data => {
                if (data.active) setActive(data.active);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return null; // Or a skeleton
    if (active.length === 0) return null; // Don't show if empty

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-sm border border-blue-100">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>🤝</span> Meine Vertretungen
                </h2>
                <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {active.length} Aktiv
                </span>
            </div>

            <div className="space-y-3">
                {active.map(sub => {
                    const completedTasks = sub.handover?.items?.filter((i: any) => i.status === 'done').length || 0;
                    const totalTasks = sub.handover?.items?.length || 0;

                    return (
                        <div key={sub._id} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/40 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-semibold text-slate-900">{sub.userName}</h3>
                                    <p className="text-sm text-slate-500">
                                        {new Date(sub.startDate).toLocaleDateString('de-DE')} - {new Date(sub.endDate).toLocaleDateString('de-DE')}
                                    </p>
                                </div>
                                <Link href={`/handover/${sub._id}`} className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                                    Tracker öffnen
                                </Link>
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-sm">
                                <span className="text-slate-600">Übergabe-Vorgänge:</span>
                                <span className={`font-medium ${completedTasks === totalTasks && totalTasks > 0 ? 'text-green-600' : 'text-slate-700'}`}>
                                    {completedTasks} / {totalTasks} erledigt
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div >
        </div >
    );
}
