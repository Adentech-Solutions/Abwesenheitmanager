// src/app/absences/new/page.tsx - ULTRA-MODERN MULTI-STEP WIZARD

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AutoReplySettings } from '@/types/absence';

// Step indicator component
const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full -z-10">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>

        {[1, 2, 3].map((step) => (
          <div key={step} className="flex flex-col items-center relative">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                step < currentStep
                  ? 'bg-gradient-to-br from-green-400 to-green-600 text-white scale-100'
                  : step === currentStep
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white scale-110 shadow-lg'
                  : 'bg-white border-2 border-gray-300 text-gray-400'
              }`}
            >
              {step < currentStep ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step
              )}
            </div>
            <span className={`mt-2 text-xs font-medium transition-colors ${
              step === currentStep ? 'text-blue-600' : 'text-gray-500'
            }`}>
              {step === 1 ? 'Details' : step === 2 ? 'Auto-Reply' : 'Bestätigung'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function NewAbsenceWizard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
    type: 'vacation',
    startDate: '',
    endDate: '',
    isHalfDay: false,
    reason: '',
  });

  // Auto-Reply Settings
  const [autoReplySettings, setAutoReplySettings] = useState<Partial<AutoReplySettings>>({
    enabled: false,
    hasSubstitute: false,
    substituteInfo: { email: '', name: '', phone: '' },
    recipients: { internal: true, external: true },
    timing: {
      activateImmediately: false,
      scheduledDate: new Date(),
      scheduledTime: '00:00',
    },
  });

  // Toast notification
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-4 rounded-xl shadow-2xl z-50 transition-all transform translate-x-full backdrop-blur-sm ${
      type === 'success' ? 'bg-green-500/90' : 'bg-red-500/90'
    } text-white`;
    toast.innerHTML = `
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          ${type === 'success' 
            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>'
            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>'
          }
        </svg>
        <span class="font-medium">${message}</span>
      </div>
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.style.transform = 'translateX(0)', 10);
    setTimeout(() => {
      toast.style.transform = 'translateX(400px)';
      setTimeout(() => document.body.contains(toast) && document.body.removeChild(toast), 300);
    }, 4000);
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate step 1
      if (!formData.type || !formData.startDate || !formData.endDate) {
        showToast('Bitte füllen Sie alle Pflichtfelder aus', 'error');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const submissionData = {
        ...formData,
        autoReplySettings: autoReplySettings.enabled ? autoReplySettings : undefined
      };

      const response = await fetch('/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Erstellen');
      }

      showToast('Antrag erfolgreich erstellt', 'success');
      setTimeout(() => router.push('/dashboard'), 500);
      
    } catch (error: any) {
      setError(error.message);
      showToast(error.message || 'Fehler beim Erstellen', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Neue Abwesenheit
            </h1>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <StepIndicator currentStep={currentStep} totalSteps={3} />

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 animate-shake">
            {error}
          </div>
        )}

        {/* Step 1: Abwesenheitsdaten */}
        {currentStep === 1 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Abwesenheitsdetails</h2>
            
            <div className="space-y-6">
              {/* Type Selection - Cards */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Art der Abwesenheit
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: 'vacation', label: 'Urlaub', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', gradient: 'from-blue-500 to-cyan-500' },
                    { value: 'sick', label: 'Krankheit', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6', gradient: 'from-red-500 to-pink-500' },
                    { value: 'training', label: 'Fortbildung', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', gradient: 'from-purple-500 to-indigo-500' },
                    { value: 'parental', label: 'Elternzeit', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', gradient: 'from-green-500 to-emerald-500' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value })}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        formData.type === type.value
                          ? 'border-transparent bg-gradient-to-br ' + type.gradient + ' text-white shadow-lg scale-105'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={type.icon} />
                      </svg>
                      <span className="text-sm font-semibold">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Von
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bis
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    min={formData.startDate}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {/* Half Day */}
              <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.isHalfDay}
                  onChange={(e) => setFormData({ ...formData, isHalfDay: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Halber Tag</span>
              </label>

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Begründung (optional)
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Optional: Weitere Details zur Abwesenheit..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Auto-Reply */}
        {currentStep === 2 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Automatische Abwesenheitsnotiz</h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoReplySettings.enabled}
                  onChange={(e) => setAutoReplySettings({ ...autoReplySettings, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-purple-600"></div>
              </label>
            </div>

            {!autoReplySettings.enabled ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">Aktivieren Sie die automatische Abwesenheitsnotiz</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Substitute */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Vertretung</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        checked={!autoReplySettings.hasSubstitute}
                        onChange={() => setAutoReplySettings({ ...autoReplySettings, hasSubstitute: false })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Keine Vertretung angeben</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        checked={autoReplySettings.hasSubstitute}
                        onChange={() => setAutoReplySettings({ ...autoReplySettings, hasSubstitute: true })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Vertretung angeben</span>
                    </label>
                  </div>

                  {autoReplySettings.hasSubstitute && (
                    <div className="mt-4 space-y-3 pl-7 animate-fadeIn">
                      <input
                        type="email"
                        placeholder="E-Mail der Vertretung"
                        value={autoReplySettings.substituteInfo?.email || ''}
                        onChange={(e) => setAutoReplySettings({
                          ...autoReplySettings,
                          substituteInfo: { ...autoReplySettings.substituteInfo!, email: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Name der Vertretung"
                        value={autoReplySettings.substituteInfo?.name || ''}
                        onChange={(e) => setAutoReplySettings({
                          ...autoReplySettings,
                          substituteInfo: { ...autoReplySettings.substituteInfo!, name: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>

                {/* Recipients */}
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Empfänger</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoReplySettings.recipients?.internal}
                        onChange={(e) => setAutoReplySettings({
                          ...autoReplySettings,
                          recipients: { ...autoReplySettings.recipients!, internal: e.target.checked }
                        })}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <span className="text-sm text-gray-700">Intern (Kollegen)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoReplySettings.recipients?.external}
                        onChange={(e) => setAutoReplySettings({
                          ...autoReplySettings,
                          recipients: { ...autoReplySettings.recipients!, external: e.target.checked }
                        })}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <span className="text-sm text-gray-700">Extern (Kunden & Partner)</span>
                    </label>
                  </div>
                </div>

                {/* Timing */}
                <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Zeitplanung</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        checked={autoReplySettings.timing?.activateImmediately}
                        onChange={() => setAutoReplySettings({
                          ...autoReplySettings,
                          timing: { ...autoReplySettings.timing!, activateImmediately: true }
                        })}
                        className="w-4 h-4 text-orange-600"
                      />
                      <span className="text-sm text-gray-700">Sofort aktivieren</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        checked={!autoReplySettings.timing?.activateImmediately}
                        onChange={() => setAutoReplySettings({
                          ...autoReplySettings,
                          timing: { ...autoReplySettings.timing!, activateImmediately: false }
                        })}
                        className="w-4 h-4 text-orange-600"
                      />
                      <span className="text-sm text-gray-700">Geplant aktivieren am Startdatum (00:00 Uhr)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 3 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Zusammenfassung</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Abwesenheit</h3>
                <p className="text-sm text-gray-600">
                  <strong>Art:</strong> {formData.type === 'vacation' ? 'Urlaub' : formData.type}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Zeitraum:</strong> {formData.startDate} bis {formData.endDate}
                </p>
                {formData.reason && (
                  <p className="text-sm text-gray-600">
                    <strong>Begründung:</strong> {formData.reason}
                  </p>
                )}
              </div>

              <div className="p-4 bg-blue-50 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Automatische Abwesenheitsnotiz</h3>
                <p className="text-sm text-gray-600">
                  <strong>Status:</strong> {autoReplySettings.enabled ? 'Aktiviert' : 'Deaktiviert'}
                </p>
                {autoReplySettings.enabled && autoReplySettings.hasSubstitute && (
                  <p className="text-sm text-gray-600">
                    <strong>Vertretung:</strong> {autoReplySettings.substituteInfo?.name} ({autoReplySettings.substituteInfo?.email})
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:shadow-md'
            }`}
          >
            Zurück
          </button>

          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
            >
              Weiter
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Wird erstellt...' : 'Antrag erstellen'}
            </button>
          )}
        </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-shake {
          animation: shake 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}