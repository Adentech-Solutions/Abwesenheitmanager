// src/components/absences/AutoReplyConfig.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { AutoReplySettings } from '@/types/absence';

interface AutoReplyConfigProps {
  startDate: Date | string;
  endDate: Date | string;
  userName: string;
  value?: Partial<AutoReplySettings>;
  onChange: (settings: Partial<AutoReplySettings>) => void;
}

export default function AutoReplyConfig({
  startDate,
  endDate,
  userName,
  value = {},
  onChange,
}: AutoReplyConfigProps) {
  // State
  const [enabled, setEnabled] = useState(value.enabled !== false);
  const [hasSubstitute, setHasSubstitute] = useState(value.hasSubstitute || false);
  const [substituteInfo, setSubstituteInfo] = useState(value.substituteInfo || {
    email: '',
    name: '',
    phone: '',
  });
  const [recipients, setRecipients] = useState(value.recipients || {
    internal: true,
    external: true,
  });
  const [timing, setTiming] = useState(value.timing || {
    activateImmediately: false,
    scheduledDate: startDate,
    scheduledTime: '00:00',
  });

  // Update parent when settings change
  useEffect(() => {
    if (!enabled) {
      onChange({ enabled: false });
      return;
    }

    onChange({
      enabled,
      hasSubstitute,
      substituteInfo: hasSubstitute ? substituteInfo : undefined,
      recipients,
      timing: {
        ...timing,
        scheduledDate: new Date(startDate),
      },
    });
  }, [enabled, hasSubstitute, substituteInfo, recipients, timing, startDate]);

  // Generate preview message
  const generatePreview = () => {
    const start = new Date(startDate).toLocaleDateString('de-DE');
    const end = new Date(endDate).toLocaleDateString('de-DE');

    let message = `Guten Tag,\n\nvielen Dank für Ihre Nachricht.\n\nIch bin vom ${start} bis ${end} abwesend und habe in dieser Zeit keinen Zugriff auf meine E-Mails.`;

    if (hasSubstitute && substituteInfo.email) {
      message += `\n\nBei dringenden Angelegenheiten wenden Sie sich bitte an meine Vertretung:\n\n${substituteInfo.name || 'Vertretung'}\nE-Mail: ${substituteInfo.email}`;
      
      if (substituteInfo.phone) {
        message += `\nTel.: ${substituteInfo.phone}`;
      }
    } else {
      message += '\n\nBei dringenden Angelegenheiten wenden Sie sich bitte an mein Team.';
    }

    message += '\n\nIch werde Ihre E-Mail nach meiner Rückkehr bearbeiten.\n\nMit freundlichen Grüßen\n' + userName;

    return message;
  };

  if (!enabled) {
    return (
      <div className="border border-gray-200 rounded-lg p-6 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              📧 Automatische Abwesenheitsnotiz
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Aktivieren Sie eine automatische E-Mail-Antwort während Ihrer Abwesenheit
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white space-y-6">
      {/* Header mit Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            📧 Automatische Abwesenheitsnotiz
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Konfigurieren Sie Ihre automatische E-Mail-Antwort
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <hr className="border-gray-200" />

      {/* Vertretung */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">👤 Vertretung</h4>
        
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="radio"
              checked={!hasSubstitute}
              onChange={() => setHasSubstitute(false)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Keine Vertretung angeben</span>
          </label>

          <label className="flex items-center">
            <input
              type="radio"
              checked={hasSubstitute}
              onChange={() => setHasSubstitute(true)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Vertretung angeben</span>
          </label>

          {hasSubstitute && (
            <div className="ml-6 space-y-3 mt-3 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📧 E-Mail *
                </label>
                <input
                  type="email"
                  value={substituteInfo.email}
                  onChange={(e) => setSubstituteInfo({ ...substituteInfo, email: e.target.value })}
                  placeholder="vertretung@firma.de"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={hasSubstitute}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  👤 Name *
                </label>
                <input
                  type="text"
                  value={substituteInfo.name}
                  onChange={(e) => setSubstituteInfo({ ...substituteInfo, name: e.target.value })}
                  placeholder="Max Mustermann"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={hasSubstitute}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📞 Telefon (optional)
                </label>
                <input
                  type="tel"
                  value={substituteInfo.phone}
                  onChange={(e) => setSubstituteInfo({ ...substituteInfo, phone: e.target.value })}
                  placeholder="+49 123 456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Empfänger */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">🌍 Empfänger</h4>
        <p className="text-xs text-gray-600 mb-3">
          Wählen Sie aus, wer die automatische Antwort erhalten soll
        </p>
        
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={recipients.internal}
              onChange={(e) => setRecipients({ ...recipients, internal: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Intern (Kollegen innerhalb der Firma)
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={recipients.external}
              onChange={(e) => setRecipients({ ...recipients, external: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Extern (Externe Kontakte und Kunden)
            </span>
          </label>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Zeitplanung */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">⏰ Zeitplanung</h4>
        
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="radio"
              checked={timing.activateImmediately}
              onChange={() => setTiming({ ...timing, activateImmediately: true })}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Sofort aktivieren</span>
          </label>

          <label className="flex items-center">
            <input
              type="radio"
              checked={!timing.activateImmediately}
              onChange={() => setTiming({ ...timing, activateImmediately: false })}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Geplant aktivieren am:</span>
          </label>

          {!timing.activateImmediately && (
            <div className="ml-6 space-y-3 mt-3 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📅 Datum
                </label>
                <input
                  type="date"
                  value={new Date(startDate).toISOString().split('T')[0]}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Wird automatisch auf Ihr Startdatum gesetzt
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🕐 Uhrzeit
                </label>
                <input
                  type="time"
                  value={timing.scheduledTime}
                  onChange={(e) => setTiming({ ...timing, scheduledTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Standard: 00:00 Uhr (Mitternacht)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Vorschau */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">👁️ Vorschau</h4>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
            {generatePreview()}
          </pre>
        </div>
      </div>
    </div>
  );
}