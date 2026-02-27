// src/app/absences/new/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AutoReplySettings } from '@/types/absence';
import SubstituteSearch from '@/components/handover/SubstituteSearch';
import HandoverSection, { HandoverItemInput, HandoverEmergencyContact } from '@/components/handover/HandoverSection';
import DashboardLayout from '@/components/layout/DashboardLayout';

// ─────────────────────────────────────────────
// STEP INDICATOR
// ─────────────────────────────────────────────

const StepIndicator = ({ currentStep, totalSteps, stepLabels }: {
  currentStep: number; totalSteps: number; stepLabels: string[];
}) => (
  <div className="mb-8">
    <div className="flex items-center justify-between relative">
      <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full -z-10">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>
      {stepLabels.map((label, idx) => {
        const step = idx + 1;
        return (
          <div key={step} className="flex flex-col items-center relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${step < currentStep ? 'bg-gradient-to-br from-green-400 to-green-600 text-white'
                : step === currentStep ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white scale-110 shadow-lg'
                  : 'bg-white border-2 border-gray-300 text-gray-400'
              }`}>
              {step < currentStep
                ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                : step}
            </div>
            <span className={`mt-2 text-xs font-medium ${step === currentStep ? 'text-blue-600' : 'text-gray-500'}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// MAIN WIZARD
// ─────────────────────────────────────────────

export default function NewAbsenceWizard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form
  const [formData, setFormData] = useState({ type: 'vacation', startDate: '', endDate: '', isHalfDay: false, reason: '' });

  // Substitute
  const [substitute, setSubstitute] = useState<{ userId: string; email: string; name: string } | null>(null);

  // Handover
  const [handoverEnabled, setHandoverEnabled] = useState(true);
  const [handoverItems, setHandoverItems] = useState<HandoverItemInput[]>([]);
  const [generalNotes, setGeneralNotes] = useState('');
  const [emergencyContact, setEmergencyContact] = useState<HandoverEmergencyContact>({ availability: 'unavailable', phone: '', note: '' });

  // Auto-Reply
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [recipients, setRecipients] = useState({ internal: true, external: true });
  const [activateImmediately, setActivateImmediately] = useState(false);
  const [customMessages, setCustomMessages] = useState<{ internal: string; external: string } | null>(null);
  const [editingMessage, setEditingMessage] = useState<'internal' | 'external' | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'internal' | 'external'>('internal');

  // Sync substitute → auto-reply
  useEffect(() => {
    if (substitute?.email) {
      // Reset custom messages wenn Vertretung sich ändert (damit Vorschau aktualisiert)
      setCustomMessages(null);
    }
  }, [substitute]);

  const daysCount = formData.startDate && formData.endDate
    ? Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;
  const recommendHandover = daysCount >= 5;

  const steps = ['Details', 'Vertretung & Übergabe', 'Auto-Reply', 'Bestätigung'];
  const totalSteps = steps.length;

  // ─── Preview Generator ───
  const generatePreview = (type: 'internal' | 'external'): string => {
    const start = formData.startDate ? new Date(formData.startDate).toLocaleDateString('de-DE') : 'TT.MM.JJJJ';
    const end = formData.endDate ? new Date(formData.endDate).toLocaleDateString('de-DE') : 'TT.MM.JJJJ';

    let msg = `Guten Tag,\n\nvielen Dank für Ihre Nachricht.\n\nIch bin vom ${start} bis ${end} abwesend`;
    msg += type === 'internal'
      ? ' und stehe in dieser Zeit nur eingeschränkt zur Verfügung.'
      : ' und habe in dieser Zeit keinen Zugriff auf meine E-Mails.';

    if (substitute?.name && substitute?.email) {
      msg += `\n\nBei dringenden Angelegenheiten wenden Sie sich bitte an meine Vertretung:\n${substitute.name}\nE-Mail: ${substitute.email}`;
    } else {
      msg += '\n\nBei dringenden Angelegenheiten wenden Sie sich bitte an mein Team.';
    }

    msg += '\n\nIch werde Ihre Nachricht nach meiner Rückkehr bearbeiten.\n\nMit freundlichen Grüßen\n[Ihr Name]';
    return msg;
  };

  const getPreviewText = (type: 'internal' | 'external') =>
    customMessages?.[type] ?? generatePreview(type);

  // ─── Toast ───
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-4 rounded-xl shadow-2xl z-50 transition-all transform translate-x-full ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`;
    toast.innerHTML = `<div class="flex items-center gap-3"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${type === 'success' ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'}"></path></svg><span class="font-medium">${message}</span></div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.style.transform = 'translateX(0)', 10);
    setTimeout(() => { toast.style.transform = 'translateX(400px)'; setTimeout(() => document.body.contains(toast) && document.body.removeChild(toast), 300); }, 4000);
  };

  const getLogicalStep = (v: number) => steps[v - 1];

  const handleNext = () => {
    const label = getLogicalStep(currentStep);
    if (label === 'Details') {
      if (!formData.startDate || !formData.endDate) { showToast('Bitte Datum auswählen', 'error'); return; }
    }
    if (label === 'Vertretung & Übergabe' && handoverEnabled) {
      if (handoverItems.filter(i => i.title.trim()).length === 0 && !generalNotes.trim()) {
        showToast('Bitte mindestens eine Aufgabe oder allgemeine Hinweise angeben', 'error'); return;
      }
      if (emergencyContact.availability === 'emergency_only' && !emergencyContact.phone?.trim()) {
        showToast('Telefonnummer für Notfälle erforderlich', 'error'); return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const submissionData: any = { ...formData };

      if (substitute?.email) {
        submissionData.substitute = { email: substitute.email, name: substitute.name };
      }

      if (handoverEnabled && (handoverItems.filter(i => i.title.trim()).length > 0 || generalNotes.trim())) {
        submissionData.handover = {
          enabled: true,
          items: handoverItems.filter(i => i.title.trim()).map(item => ({
            id: item.id,
            title: item.title,
            description: item.description || undefined,
            priority: item.priority,
            dueDate: item.dueDate,
            links: item.links.filter(l => l.title.trim() && l.url.trim()),
            attachments: item.attachments || [],
            isUrgent: item.priority === 'high',
          })),
          generalNotes: generalNotes.trim() || undefined,
          emergencyContact,
        };
      }

      if (autoReplyEnabled) {
        submissionData.autoReplySettings = {
          enabled: true,
          hasSubstitute: !!substitute?.email,
          substituteInfo: substitute?.email ? { email: substitute.email, name: substitute.name } : undefined,
          recipients,
          timing: { activateImmediately, scheduledDate: new Date(formData.startDate), scheduledTime: '00:00' },
          customMessages: customMessages || undefined,
        };
      }

      const res = await fetch('/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Erstellen');

      showToast('Antrag erfolgreich erstellt', 'success');
      setTimeout(() => router.push('/dashboard'), 500);
    } catch (err: any) {
      setError(err.message);
      showToast(err.message || 'Fehler', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentLabel = getLogicalStep(currentStep);
  const validItemCount = handoverItems.filter(i => i.title.trim()).length;
  const highPriorityCount = handoverItems.filter(i => i.priority === 'high' && i.title.trim()).length;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">

        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Neue Abwesenheit
            </h1>
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} stepLabels={steps} />

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* ─── Step 1: Details ─── */}
          {currentLabel === 'Details' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 animate-fadeIn">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Abwesenheitsdetails</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Art der Abwesenheit</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'vacation', label: 'Urlaub', gradient: 'from-blue-500 to-cyan-500', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                      { value: 'sick', label: 'Krankheit', gradient: 'from-red-500 to-pink-500', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
                      { value: 'training', label: 'Fortbildung', gradient: 'from-purple-500 to-indigo-500', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
                      { value: 'parental', label: 'Elternzeit', gradient: 'from-green-500 to-emerald-500', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                    ].map(t => (
                      <button key={t.value} type="button"
                        onClick={() => setFormData({ ...formData, type: t.value })}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${formData.type === t.value
                            ? `border-transparent bg-gradient-to-br ${t.gradient} text-white shadow-lg scale-105`
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md text-gray-700'
                          }`}>
                        <svg className="w-7 h-7 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
                        </svg>
                        <span className="text-sm font-semibold">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Von</label>
                    <input type="date" value={formData.startDate}
                      onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bis</label>
                    <input type="date" value={formData.endDate} min={formData.startDate}
                      onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                </div>

                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <input type="checkbox" checked={formData.isHalfDay}
                    onChange={e => setFormData({ ...formData, isHalfDay: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded" />
                  <span className="text-sm font-medium text-gray-700">Halber Tag</span>
                </label>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Begründung (optional)</label>
                  <textarea value={formData.reason} rows={3}
                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Weitere Details zur Abwesenheit..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 2: Vertretung & Übergabe ─── */}
          {currentLabel === 'Vertretung & Übergabe' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 animate-fadeIn">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Vertretung & Übergabe</h2>
              <div className="space-y-5">
                <SubstituteSearch
                  onSelect={sub => setSubstitute(sub.email ? sub : null)}
                  selectedEmail={substitute?.email}
                />
                <HandoverSection
                  enabled={handoverEnabled}
                  onToggle={setHandoverEnabled}
                  items={handoverItems}
                  onItemsChange={setHandoverItems}
                  generalNotes={generalNotes}
                  onGeneralNotesChange={setGeneralNotes}
                  emergencyContact={emergencyContact}
                  onEmergencyContactChange={setEmergencyContact}
                  substituteName={substitute?.name}
                  recommendHandover={recommendHandover}
                />
              </div>
            </div>
          )}

          {/* ─── Step 3: Auto-Reply ─── */}
          {currentLabel === 'Auto-Reply' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Automatische Abwesenheitsnotiz</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Outlook sendet während Ihrer Abwesenheit automatisch eine Antwort</p>
                </div>
                {/* Toggle */}
                <button type="button" onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${autoReplyEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${autoReplyEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {!autoReplyEnabled ? (
                <div className="text-center py-10 text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Automatische Abwesenheitsnotiz ist deaktiviert</p>
                </div>
              ) : (
                <div className="space-y-5">

                  {/* Substitute info — readonly, aus Schritt 2 */}
                  {substitute?.email && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-600">
                        Vertretung: <strong className="text-gray-800">{substitute.name}</strong> ({substitute.email}) — wird automatisch in der Nachricht erwähnt
                      </span>
                    </div>
                  )}

                  {/* Empfänger */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Empfänger</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={recipients.internal}
                          onChange={e => setRecipients({ ...recipients, internal: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm text-gray-700">Intern (Kollegen)</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={recipients.external}
                          onChange={e => setRecipients({ ...recipients, external: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm text-gray-700">Extern (Kunden & Partner)</span>
                      </label>
                    </div>
                  </div>

                  {/* Zeitplanung */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Aktivierung</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="radio" checked={activateImmediately} onChange={() => setActivateImmediately(true)} className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-700">Sofort aktivieren</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="radio" checked={!activateImmediately} onChange={() => setActivateImmediately(false)} className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-700">
                          Automatisch am Startdatum aktivieren
                          {formData.startDate && <span className="ml-1 text-gray-500">({new Date(formData.startDate).toLocaleDateString('de-DE')})</span>}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Nachrichtenvorschau */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex border-b border-gray-200 bg-gray-50">
                      <button type="button"
                        onClick={() => setActivePreviewTab('internal')}
                        className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${activePreviewTab === 'internal' ? 'bg-white text-gray-900 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}>
                        Interne Nachricht
                      </button>
                      <button type="button"
                        onClick={() => setActivePreviewTab('external')}
                        className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${activePreviewTab === 'external' ? 'bg-white text-gray-900 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}>
                        Externe Nachricht
                      </button>
                    </div>

                    <div className="p-4 bg-white">
                      {editingMessage === activePreviewTab ? (
                        <div className="space-y-3">
                          <textarea
                            rows={10}
                            value={customMessages?.[activePreviewTab] ?? generatePreview(activePreviewTab)}
                            onChange={e => setCustomMessages(prev => ({ internal: prev?.internal ?? generatePreview('internal'), external: prev?.external ?? generatePreview('external'), [activePreviewTab]: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                          <div className="flex gap-2">
                            <button type="button"
                              onClick={() => setEditingMessage(null)}
                              className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                              Fertig
                            </button>
                            <button type="button"
                              onClick={() => {
                                setCustomMessages(prev => {
                                  if (!prev) return null;
                                  const updated = { ...prev, [activePreviewTab]: generatePreview(activePreviewTab) };
                                  return updated;
                                });
                                setEditingMessage(null);
                              }}
                              className="px-3 py-1.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">
                              Zurücksetzen
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                            {getPreviewText(activePreviewTab)}
                          </pre>
                          <button type="button"
                            onClick={() => setEditingMessage(activePreviewTab)}
                            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Nachricht bearbeiten
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* ─── Step 4: Bestätigung ─── */}
          {currentLabel === 'Bestätigung' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 animate-fadeIn">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Zusammenfassung</h2>
              <div className="space-y-4">

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Abwesenheit</h3>
                  <p className="text-sm text-gray-600"><strong>Art:</strong> {
                    { vacation: 'Urlaub', sick: 'Krankheit', training: 'Fortbildung', parental: 'Elternzeit' }[formData.type] ?? formData.type
                  }</p>
                  <p className="text-sm text-gray-600"><strong>Zeitraum:</strong> {formData.startDate} bis {formData.endDate}</p>
                  {formData.reason && <p className="text-sm text-gray-600"><strong>Begründung:</strong> {formData.reason}</p>}
                </div>

                {substitute?.email && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Vertretung</h3>
                    <p className="text-sm text-gray-600">{substitute.name} — {substitute.email}</p>
                  </div>
                )}

                {handoverEnabled && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Übergabe</h3>
                    <p className="text-sm text-gray-600">
                      {validItemCount} Aufgabe{validItemCount !== 1 ? 'n' : ''}
                      {highPriorityCount > 0 && <span className="ml-1 text-red-600">({highPriorityCount} hohe Priorität)</span>}
                    </p>
                    {generalNotes.trim() && <p className="text-sm text-gray-600">Allgemeine Hinweise: Ja</p>}
                    <p className="text-sm text-gray-600">Erreichbarkeit: {
                      { unavailable: 'Nicht erreichbar', emergency_only: 'Nur Notfälle', limited_email: 'Per E-Mail' }[emergencyContact.availability]
                    }</p>
                  </div>
                )}

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Automatische Abwesenheitsnotiz</h3>
                  <p className="text-sm text-gray-600"><strong>Status:</strong> {autoReplyEnabled ? 'Aktiviert' : 'Deaktiviert'}</p>
                  {autoReplyEnabled && (
                    <p className="text-sm text-gray-600">
                      Empfänger: {[recipients.internal && 'Intern', recipients.external && 'Extern'].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between">
            <button onClick={handleBack} disabled={currentStep === 1}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${currentStep === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:shadow-md'}`}>
              Zurück
            </button>
            {currentStep < totalSteps ? (
              <button onClick={handleNext}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all">
                Weiter
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50">
                {isSubmitting ? 'Wird erstellt...' : 'Antrag erstellen'}
              </button>
            )}
          </div>
        </div>

        <style jsx global>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        `}</style>
      </div>
    </DashboardLayout>
  );
}