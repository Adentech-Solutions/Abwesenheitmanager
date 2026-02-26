'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useSession } from 'next-auth/react';

export default function HandoverView({ params }: { params: { absenceId: string } }) {
    const router = useRouter();
    const { data: session } = useSession();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [newNote, setNewNote] = useState('');
    const [returnSummary, setReturnSummary] = useState('');
    const [submittingNote, setSubmittingNote] = useState(false);
    const [submittingSummary, setSubmittingSummary] = useState(false);

    useEffect(() => {
        fetchData();
    }, [params.absenceId]);

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/handover/${params.absenceId}`);
            if (!res.ok) throw new Error('Fehler beim Laden der Übergabe');
            const json = await res.json();
            setData(json);
            if (json.returnSummary?.content) {
                setReturnSummary(json.returnSummary.content);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleItemStatus = async (itemId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'done' ? 'open' : 'done';
        try {
            const res = await fetch(`/api/handover/${params.absenceId}/items/${itemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;
        setSubmittingNote(true);
        try {
            const res = await fetch(`/api/handover/${params.absenceId}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newNote })
            });
            if (res.ok) {
                setNewNote('');
                fetchData();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmittingNote(false);
        }
    };

    const handleSubmitSummary = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!returnSummary.trim()) return;
        setSubmittingSummary(true);
        try {
            // Create a form data object because the endpoint expects form-data for magic links
            // BUT WAIT: The endpoint we built requires a token. 
            // Let's create an authenticated endpoint for Return Summary as well.
            // Actually, building a POST for /api/handover/[absenceId]/return-summary/auth is better.
            // I'll define it here for now to use a json payload and we can update the API later if needed.
            const res = await fetch(`/api/handover/${params.absenceId}/return-summary/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ summary: returnSummary })
            });
            if (res.ok) {
                fetchData();
            } else {
                alert('Fehler beim Speichern');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmittingSummary(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !data) {
        return (
            <DashboardLayout>
                <div className="p-8">
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl">{error || 'Übergabe nicht gefunden'}</div>
                </div>
            </DashboardLayout>
        );
    }

    const { absenceDetails, items, activityNotes, generalNotes, emergencyContact } = data;
    const userRole = (session?.user as any)?.role;
    const canEdit = absenceDetails.isSubstitutedByMe || userRole === 'admin' || userRole === 'manager';

    const completedCount = items?.filter((i: any) => i.status === 'done').length || 0;
    const totalCount = items?.length || 0;
    const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                            Übergabe Tracker
                        </h1>
                        <p className="text-slate-500 mt-2">
                            von {absenceDetails.employeeName} für {absenceDetails.substituteName}
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex flex-col items-end">
                        <span className="text-sm text-slate-500 mb-1">
                            {new Date(absenceDetails.startDate).toLocaleDateString('de-DE')} - {new Date(absenceDetails.endDate).toLocaleDateString('de-DE')}
                        </span>
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
                            {progressPercent}% Abgeschlossen
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content (Tasks) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Progress Bar */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <div className="flex justify-between text-sm font-medium mb-2">
                                <span className="text-slate-700">Fortschritt</span>
                                <span className="text-slate-500">{completedCount} von {totalCount} Vorgängen erledigt</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5">
                                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                            </div>
                        </div>

                        {/* Vorgänge Liste */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="font-semibold text-slate-800">Zu erledigende Vorgänge</h2>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {items?.map((item: any) => (
                                    <div key={item.id} className={`p-6 hover:bg-slate-50 transition-colors ${item.status === 'done' ? 'opacity-70' : ''}`}>
                                        <div className="flex items-start gap-4">
                                            {canEdit ? (
                                                <div className="flex-shrink-0 pt-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.status === 'done'}
                                                        onChange={() => handleToggleItemStatus(item.id, item.status)}
                                                        className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex-shrink-0 pt-1">
                                                    {item.status === 'done' ? '✅' : '⏳'}
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className={`text-base font-medium ${item.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                                                        {item.title}
                                                    </h3>
                                                    {item.isUrgent && (
                                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                            Dringend
                                                        </span>
                                                    )}
                                                </div>
                                                {item.description && (
                                                    <p className="text-sm text-slate-600 mb-3 whitespace-pre-wrap">{item.description}</p>
                                                )}
                                                {item.links && item.links.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.links.map((link: any, idx: number) => (
                                                            <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                                                                🔗 {link.title}
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!items || items.length === 0) && (
                                    <div className="p-8 text-center text-slate-500">
                                        Keine spezifischen Vorgänge hinterlegt.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Activity Stream */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="font-semibold text-slate-800">Aktivitäten & Notizen</h2>
                            </div>

                            <div className="p-6">
                                {/* Notes List */}
                                <div className="space-y-6 mb-6">
                                    {activityNotes?.map((note: any) => (
                                        <div key={note.id} className="flex gap-4">
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                                    {note.createdByName?.charAt(0) || '?'}
                                                </div>
                                            </div>
                                            <div className="flex-1 bg-slate-50 rounded-2xl rounded-tl-none p-4 border border-slate-100">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-medium text-slate-900">{note.createdByName}</span>
                                                    <span className="text-xs text-slate-500">{new Date(note.createdAt).toLocaleString('de-DE')}</span>
                                                </div>
                                                <p className="text-slate-700 text-sm whitespace-pre-wrap">{note.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!activityNotes || activityNotes.length === 0) && (
                                        <div className="text-center text-slate-500 py-4 text-sm">Noch keine Notizen vorhanden.</div>
                                    )}
                                </div>

                                {/* Add Note Form */}
                                {canEdit && (
                                    <form onSubmit={handleAddNote} className="mt-4 pt-6 border-t border-slate-100">
                                        <textarea
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-shadow"
                                            rows={3}
                                            placeholder="Notiz hinzufügen..."
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                        ></textarea>
                                        <div className="mt-3 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={submittingNote || !newNote.trim()}
                                                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                                            >
                                                {submittingNote ? 'Speichert...' : 'Notiz speichern'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* Return Summary Section */}
                        {canEdit && (
                            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-6">
                                <h2 className="text-lg font-bold text-slate-900 mb-2">Rückkehr-Zusammenfassung</h2>
                                <p className="text-slate-600 text-sm mb-4">
                                    Schreiben Sie hier eine Zusammenfassung der Geschehnisse für {absenceDetails.employeeName}, die bei Rückkehr gesendet wird.
                                </p>
                                <form onSubmit={handleSubmitSummary}>
                                    <textarea
                                        className="w-full px-4 py-3 border border-white bg-white/50 backdrop-blur-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-shadow"
                                        rows={4}
                                        placeholder="Was ist passiert? Welche Aufgaben sind noch offen?"
                                        value={returnSummary}
                                        onChange={(e) => setReturnSummary(e.target.value)}
                                    ></textarea>
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={submittingSummary || !returnSummary.trim()}
                                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                        >
                                            {submittingSummary ? 'Speichert...' : (data.returnSummary?.content ? 'Aktualisieren' : 'Zusammenfassung speichern')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">

                        {/* General Notes */}
                        {generalNotes && (
                            <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-100">
                                <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                                    <span>💡</span> Allgemeine Hinweise
                                </h3>
                                <p className="text-yellow-800 text-sm whitespace-pre-wrap">{generalNotes}</p>
                            </div>
                        )}

                        {/* Emergency Contact */}
                        {emergencyContact && emergencyContact.availability !== 'unavailable' && (
                            <div className={`rounded-2xl p-6 border ${emergencyContact.availability === 'emergency_only' ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'}`}>
                                <h3 className={`font-semibold mb-3 flex items-center gap-2 ${emergencyContact.availability === 'emergency_only' ? 'text-red-900' : 'text-orange-900'}`}>
                                    {emergencyContact.availability === 'emergency_only' ? '🚨 Notfallkontakt' : '📧 Eingeschränkt Erreichbar'}
                                </h3>
                                {emergencyContact.phone && (
                                    <p className={`text-lg font-medium mb-2 ${emergencyContact.availability === 'emergency_only' ? 'text-red-700' : 'text-orange-700'}`}>
                                        📞 {emergencyContact.phone}
                                    </p>
                                )
                                }
                                {
                                    emergencyContact.note && (
                                        <p className={`text-sm ${emergencyContact.availability === 'emergency_only' ? 'text-red-800' : 'text-orange-800'}`}>
                                            {emergencyContact.note}
                                        </p>
                                    )}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}
