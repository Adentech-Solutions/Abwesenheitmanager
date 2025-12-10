'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Save, Settings as SettingsIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    defaultVacationDays: 30,
    carryOverLimit: 5,
    companyName: 'Adentech Solutions',
    supportEmail: 'support@adentech.de',
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      return data.settings;
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        ...settings,
      }));
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: newSettings }),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Einstellungen gespeichert');
    },
    onError: () => {
      toast.error('Fehler beim Speichern');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (isLoading) return <DashboardLayout><div>Laden...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Systemeinstellungen</h1>
          <p className="text-gray-600">Konfigurieren Sie globale Systemeinstellungen</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Absence Settings */}
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <SettingsIcon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold">Abwesenheiten</h2>
              </div>

              <div className="space-y-4">
                <Input
                  type="number"
                  label="Standard Urlaubstage pro Jahr"
                  value={formData.defaultVacationDays}
                  onChange={(e) => setFormData({ ...formData, defaultVacationDays: parseInt(e.target.value) })}
                  required
                />
                <Input
                  type="number"
                  label="Max. Resturlaub Übertrag"
                  value={formData.carryOverLimit}
                  onChange={(e) => setFormData({ ...formData, carryOverLimit: parseInt(e.target.value) })}
                  required
                />
              </div>
            </Card>

            {/* General Settings */}
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                  <SettingsIcon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold">Allgemein</h2>
              </div>

              <div className="space-y-4">
                <Input
                  label="Firmenname"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                />
                <Input
                  type="email"
                  label="Support E-Mail"
                  value={formData.supportEmail}
                  onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                  required
                />
              </div>
            </Card>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              type="submit"
              isLoading={mutation.isPending}
              size="lg"
            >
              <Save className="h-4 w-4 mr-2" />
              Einstellungen speichern
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}