import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PartyPopper, MessageSquare, ArrowRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WelcomeBack() {
    const [recentAbsences, setRecentAbsences] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/absences')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const now = new Date();
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
        <Card className="bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/30 border-emerald-100 shadow-sm mb-8 animate-in fade-in zoom-in-95 duration-700">
            <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2 text-emerald-900">
                    <PartyPopper className="h-5 w-5 text-emerald-600" />
                    Willkommen zurück!
                </CardTitle>
                <p className="text-sm text-emerald-700/60 font-medium">
                    Hier sind die Zusammenfassungen deiner Vertretungen
                </p>
            </CardHeader>

            <CardContent className="space-y-4">
                {recentAbsences.map((absence, index) => (
                    <div 
                        key={absence._id} 
                        className={cn(
                            "bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-emerald-100/50 shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both",
                            `delay-[${index * 150}ms]`
                        )}
                    >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                                    <p className="text-sm font-bold text-gray-900">
                                        Zusammenfassung von {absence.substitute?.name}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 opacity-60">
                                    <Calendar className="h-3 w-3 text-gray-400" />
                                    <p className="text-[11px] font-bold text-gray-500">
                                        Abwesenheit: {new Date(absence.startDate).toLocaleDateString('de-DE')} — {new Date(absence.endDate).toLocaleDateString('de-DE')}
                                    </p>
                                </div>
                            </div>
                            <Button asChild variant="success" size="sm" className="rounded-xl font-bold h-9 shadow-sm group">
                                <Link href={`/handover/${absence._id}`} className="flex items-center gap-2">
                                    Details
                                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </Button>
                        </div>
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/50 italic text-gray-700 text-sm leading-relaxed relative">
                            <span className="absolute -top-2 -left-1 text-2xl text-emerald-200 font-serif leading-none">“</span>
                            {absence.handover.returnSummary.content}
                            <span className="absolute -bottom-4 -right-1 text-2xl text-emerald-200 font-serif leading-none">”</span>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
