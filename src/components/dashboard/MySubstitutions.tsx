import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ExternalLink, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

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

    if (loading) {
        return (
            <Card className="bg-primary-50/30 border-primary-100 shadow-none">
                <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-24 w-full rounded-xl" />
                </CardContent>
            </Card>
        );
    }
    
    if (active.length === 0) return null;

    return (
        <Card className="bg-gradient-to-br from-primary-50/50 via-white to-primary-50/30 border-primary-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2 text-primary-900">
                        <Users className="h-5 w-5 text-primary-600" />
                        Meine Vertretungen
                    </CardTitle>
                    <Badge variant="info" className="bg-primary-600 text-white border-0 px-2.5 py-0.5 rounded-full font-bold shadow-sm">
                        {active.length} Aktiv
                    </Badge>
                </div>
                <p className="text-sm text-primary-700/60 font-medium">
                    Du vertrittst aktuell folgende Kollegen
                </p>
            </CardHeader>

            <CardContent className="space-y-4">
                {active.map((sub, index) => {
                    const completedTasks = sub.handover?.items?.filter((i: any) => i.status === 'done').length || 0;
                    const totalTasks = sub.handover?.items?.length || 0;
                    const isFullyCompleted = completedTasks === totalTasks && totalTasks > 0;

                    return (
                        <div 
                            key={sub._id} 
                            className={cn(
                                "group bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-primary-100/50 shadow-sm hover:shadow-md hover:border-primary-300 transition-all animate-in fade-in zoom-in-95 duration-500 fill-mode-both",
                                `delay-[${index * 150}ms]`
                            )}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-gray-900 group-hover:text-primary-700 transition-colors uppercase tracking-tight text-sm">
                                        {sub.userName}
                                    </h3>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <Clock className="h-3 w-3 text-gray-400" />
                                        <p className="text-[11px] font-bold text-gray-500">
                                            {new Date(sub.startDate).toLocaleDateString('de-DE')} — {new Date(sub.endDate).toLocaleDateString('de-DE')}
                                        </p>
                                    </div>
                                </div>
                                <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg group/btn">
                                    <Link href={`/handover/${sub._id}`} className="flex items-center gap-1.5 text-xs font-bold">
                                        Tracker
                                        <ExternalLink className="h-3 w-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                    </Link>
                                </Button>
                            </div>
                            
                            <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Erledigt</span>
                                <div className="flex items-center gap-2">
                                    {isFullyCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 animate-in zoom-in-0 duration-500" />}
                                    <span className={cn(
                                        "text-xs font-bold tabular-nums",
                                        isFullyCompleted ? "text-emerald-600" : "text-gray-700"
                                    )}>
                                        {completedTasks} <span className="text-gray-300 mx-0.5">/</span> {totalTasks}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Small progress bar inside card */}
                            {totalTasks > 0 && (
                                <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className={cn(
                                            "h-full transition-all duration-1000",
                                            isFullyCompleted ? "bg-emerald-500" : "bg-primary-500"
                                        )}
                                        style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
