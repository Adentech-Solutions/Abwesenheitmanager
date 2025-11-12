'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, MapPin, Calendar, Users, Bell, Save } from 'lucide-react';
import toast from 'react-hot-toast';

// German States
const GERMAN_STATES = [
  { value: 'BW', label: 'Baden-Württemberg' },
  { value: 'BY', label: 'Bayern' },
  { value: 'BE', label: 'Berlin' },
  { value: 'BB', label: 'Brandenburg' },
  { value: 'HB', label: 'Bremen' },
  { value: 'HH', label: 'Hamburg' },
  { value: 'HE', label: 'Hessen' },
  { value: 'MV', label: 'Mecklenburg-Vorpommern' },
  { value: 'NI', label: 'Niedersachsen' },
  { value: 'NW', label: 'Nordrhein-Westfalen' },
  { value: 'RP', label: 'Rheinland-Pfalz' },
  { value: 'SL', label: 'Saarland' },
  { value: 'SN', label: 'Sachsen' },
  { value: 'ST', label: 'Sachsen-Anhalt' },
  { value: 'SH', label: 'Schleswig-Holstein' },
  { value: 'TH', label: 'Thüringen' },
];

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>(null);

  // Redirect if not admin
  React.useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/');
      return;
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['company', 'settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings/company');
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
  });

  // Set initial form data when settings load
  React.useEffect(() => {
    if (settings && !formData) {
      setFormData(settings.settings);
    }
  }, [settings, formData]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/settings/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update settings');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', 'settings'] });
      toast.success('Einstellungen erfolgreich gespeichert!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      updateMutation.mutate(formData);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (status === 'loading' || isLoading || !formData) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary-600" />
            Unternehmenseinstellungen
          </h1>
          <p className="text-gray-600 mt-2">
            Konfiguriere firmenweite Einstellungen für das Abwesenheitsmanagement
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Info */}
          <Card>
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Unternehmensinfo
                </h3>
              </div>

              <Input
                type="text"
                label="Firmenname"
                value={formData.companyName || ''}
                onChange={(e) => handleChange('companyName', e.target.value)}
                placeholder="Meine Firma GmbH"
              />

              <Select
                label="Bundesland (für Feiertage) *"
                value={formData.state || 'BY'}
                onChange={(e) => handleChange('state', e.target.value)}
                options={GERMAN_STATES}
              />
              <p className="text-xs text-gray-500 -mt-2">
                Die Feiertage werden basierend auf dem ausgewählten Bundesland angezeigt
              </p>
            </div>
          </Card>

          {/* Vacation Settings */}
          <Card>
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Urlaubseinstellungen
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="Standard-Urlaubstage pro Jahr"
                  min="20"
                  max="40"
                  value={formData.vacationDaysPerYear || 30}
                  onChange={(e) => handleChange('vacationDaysPerYear', parseInt(e.target.value))}
                />

                <Input
                  type="number"
                  label="Übertragbare Tage ins nächste Jahr"
                  min="0"
                  max="10"
                  value={formData.carryOverDays || 5}
                  onChange={(e) => handleChange('carryOverDays', parseInt(e.target.value))}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="requireApproval"
                  checked={formData.requireApproval ?? true}
                  onChange={(e) => handleChange('requireApproval', e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="requireApproval" className="text-sm text-gray-700">
                  Urlaub muss genehmigt werden
                </label>
              </div>
            </div>
          </Card>

          {/* Team Settings */}
          <Card>
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Team-Einstellungen
                </h3>
              </div>

              <Input
                type="number"
                label="Max. gleichzeitige Abwesenheiten"
                min="1"
                max="10"
                value={formData.maxConcurrentAbsences || 3}
                onChange={(e) => handleChange('maxConcurrentAbsences', parseInt(e.target.value))}
                helperText="Warnung bei Überschreitung dieser Anzahl"
              />
            </div>
          </Card>

          {/* Notification Settings */}
          <Card>
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Benachrichtigungen
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="notifyManager"
                    checked={formData.notifyManagerOnRequest ?? true}
                    onChange={(e) => handleChange('notifyManagerOnRequest', e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="notifyManager" className="text-sm text-gray-700">
                    Manager bei neuen Anträgen benachrichtigen
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="notifyUser"
                    checked={formData.notifyUserOnApproval ?? true}
                    onChange={(e) => handleChange('notifyUserOnApproval', e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="notifyUser" className="text-sm text-gray-700">
                    Mitarbeiter bei Genehmigung/Ablehnung benachrichtigen
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={updateMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Einstellungen speichern
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}