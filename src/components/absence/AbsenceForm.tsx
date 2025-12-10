'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Card from '../ui/Card';

export default function AbsenceForm({ initialType = 'vacation' }: { initialType?: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: initialType,
    startDate: '',
    endDate: '',
    isHalfDay: false,
    reason: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.startDate) newErrors.startDate = 'Startdatum ist erforderlich';
    if (!formData.endDate) newErrors.endDate = 'Enddatum ist erforderlich';
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'Enddatum muss nach Startdatum liegen';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create absence');
      }

      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error creating absence:', error);
      alert(error.message || 'Fehler beim Erstellen der Abwesenheit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Select
          label="Art der Abwesenheit"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          options={[
            { value: 'vacation', label: 'Urlaub' },
            { value: 'sick', label: 'Krankheit' },
            { value: 'training', label: 'Fortbildung' },
            { value: 'parental', label: 'Elternzeit' },
          ]}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="date"
            label="Von"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
            error={errors.startDate}
          />
          <Input
            type="date"
            label="Bis"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            required
            error={errors.endDate}
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="halfDay"
            checked={formData.isHalfDay}
            onChange={(e) => setFormData({ ...formData, isHalfDay: e.target.checked })}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label htmlFor="halfDay" className="ml-2 text-sm text-gray-700">
            Halber Tag
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Begründung (optional)
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Antrag stellen
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Abbrechen
          </Button>
        </div>
      </form>
    </Card>
  );
}