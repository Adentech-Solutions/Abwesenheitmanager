'use client';

// src/components/handover/HandoverSection.tsx

import React, { useState, useRef } from 'react';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type Priority = 'high' | 'medium' | 'low';

export interface HandoverItemInput {
    id: string;
    title: string;
    description: string;
    priority: Priority;
    dueDate?: string;
    links: { title: string; url: string }[];
    attachments: { name: string; size: number; base64: string; type: string }[];
    isUrgent: boolean;
}

export interface HandoverEmergencyContact {
    availability: 'unavailable' | 'emergency_only' | 'limited_email';
    phone?: string;
    note?: string;
}

interface HandoverSectionProps {
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
    items: HandoverItemInput[];
    onItemsChange: (items: HandoverItemInput[]) => void;
    generalNotes: string;
    onGeneralNotesChange: (notes: string) => void;
    emergencyContact: HandoverEmergencyContact;
    onEmergencyContactChange: (ec: HandoverEmergencyContact) => void;
    substituteName?: string;
    recommendHandover?: boolean;
}

// ─────────────────────────────────────────────
// PRIORITY CONFIG
// ─────────────────────────────────────────────

const PRIORITY_CONFIG: Record<Priority, {
    label: string;
    activeClass: string;
    dotClass: string;
}> = {
    high: { label: 'Hoch', activeClass: 'bg-red-50 border-red-300 text-red-700', dotClass: 'bg-red-500' },
    medium: { label: 'Mittel', activeClass: 'bg-amber-50 border-amber-300 text-amber-700', dotClass: 'bg-amber-400' },
    low: { label: 'Niedrig', activeClass: 'bg-green-50 border-green-300 text-green-700', dotClass: 'bg-green-500' },
};

// ─────────────────────────────────────────────
// TOGGLE SWITCH
// ─────────────────────────────────────────────

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${checked ? 'bg-blue-600' : 'bg-gray-300'
                }`}
            role="switch"
            aria-checked={checked}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'
                }`} />
        </button>
    );
}

// ─────────────────────────────────────────────
// PRIORITY SELECTOR
// ─────────────────────────────────────────────

function PrioritySelector({ value, onChange }: { value: Priority; onChange: (p: Priority) => void }) {
    return (
        <div className="flex gap-1.5">
            {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG[Priority]][]).map(([p, cfg]) => (
                <button
                    key={p}
                    type="button"
                    onClick={() => onChange(p)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${value === p
                            ? cfg.activeClass
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${value === p ? cfg.dotClass : 'bg-gray-300'}`} />
                    {cfg.label}
                </button>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────
// TASK CARD
// ─────────────────────────────────────────────

function TaskCard({
    item,
    index,
    total,
    onUpdate,
    onRemove,
    onMoveUp,
    onMoveDown,
}: {
    item: HandoverItemInput;
    index: number;
    total: number;
    onUpdate: (updates: Partial<HandoverItemInput>) => void;
    onRemove: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
}) {
    const [expanded, setExpanded] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cfg = PRIORITY_CONFIG[item.priority];

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const newAttachments = await Promise.all(
            files.map(file => new Promise<{ name: string; size: number; base64: string; type: string }>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve({
                    name: file.name,
                    size: file.size,
                    base64: (reader.result as string).split(',')[1],
                    type: file.type,
                });
                reader.readAsDataURL(file);
            }))
        );
        onUpdate({ attachments: [...item.attachments, ...newAttachments] });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const priorityDotClass = cfg.dotClass;

    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 bg-gray-50 border-b border-gray-200">
                {/* Drag dots */}
                <div className="flex flex-col gap-0.5 cursor-grab text-gray-300 flex-shrink-0">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="flex gap-0.5">
                            <div className="w-1 h-1 rounded-full bg-current" />
                            <div className="w-1 h-1 rounded-full bg-current" />
                        </div>
                    ))}
                </div>

                {/* Priority dot */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDotClass}`} />

                {/* Title */}
                <span className="flex-1 text-sm font-medium text-gray-700 truncate">
                    {item.title || `Aufgabe ${index + 1}`}
                </span>

                {/* Move up/down */}
                <div className="flex gap-0.5">
                    <button type="button" onClick={onMoveUp} disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-25 disabled:cursor-not-allowed rounded">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                        </svg>
                    </button>
                    <button type="button" onClick={onMoveDown} disabled={index === total - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-25 disabled:cursor-not-allowed rounded">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                {/* Expand */}
                <button type="button" onClick={() => setExpanded(!expanded)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded">
                    <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Remove */}
                <button type="button" onClick={onRemove}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Body */}
            {expanded && (
                <div className="p-4 space-y-3">
                    {/* Title input */}
                    <input
                        type="text"
                        value={item.title}
                        onChange={(e) => onUpdate({ title: e.target.value })}
                        placeholder="Titel der Aufgabe *"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                    />

                    {/* Priority + Due Date */}
                    <div className="flex flex-wrap items-end gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Priorität</label>
                            <PrioritySelector value={item.priority} onChange={(p) => onUpdate({ priority: p, isUrgent: p === 'high' })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Fällig bis</label>
                            <input
                                type="date"
                                value={item.dueDate || ''}
                                onChange={(e) => onUpdate({ dueDate: e.target.value || undefined })}
                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <textarea
                        value={item.description}
                        onChange={(e) => onUpdate({ description: e.target.value })}
                        placeholder="Beschreibung, Details, Hinweise..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />

                    {/* Links */}
                    {item.links.map((link, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                            <input
                                type="text"
                                value={link.title}
                                onChange={(e) => {
                                    const updated = [...item.links];
                                    updated[idx] = { ...updated[idx], title: e.target.value };
                                    onUpdate({ links: updated });
                                }}
                                placeholder="Link-Titel"
                                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="url"
                                value={link.url}
                                onChange={(e) => {
                                    const updated = [...item.links];
                                    updated[idx] = { ...updated[idx], url: e.target.value };
                                    onUpdate({ links: updated });
                                }}
                                placeholder="https://..."
                                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button type="button" onClick={() => onUpdate({ links: item.links.filter((_, i) => i !== idx) })}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}

                    {/* Attachments */}
                    {item.attachments.map((att, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <span className="flex-1 text-gray-700 truncate">{att.name}</span>
                            <span className="text-xs text-gray-400">{formatSize(att.size)}</span>
                            <button type="button" onClick={() => onUpdate({ attachments: item.attachments.filter((_, i) => i !== idx) })}
                                className="text-gray-400 hover:text-red-500">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}

                    {/* Actions row */}
                    <div className="flex gap-4 pt-0.5">
                        <button type="button"
                            onClick={() => onUpdate({ links: [...item.links, { title: '', url: '' }] })}
                            className="text-xs text-gray-500 hover:text-gray-800 font-medium transition-colors underline-offset-2 hover:underline">
                            Link hinzufügen
                        </button>
                        <button type="button" onClick={() => fileInputRef.current?.click()}
                            className="text-xs text-gray-500 hover:text-gray-800 font-medium transition-colors underline-offset-2 hover:underline">
                            Anhang hinzufügen
                        </button>
                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg" />
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export default function HandoverSection({
    enabled, onToggle,
    items, onItemsChange,
    generalNotes, onGeneralNotesChange,
    emergencyContact, onEmergencyContactChange,
    substituteName, recommendHandover,
}: HandoverSectionProps) {

    const addItem = () => {
        onItemsChange([...items, {
            id: `item_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            title: '', description: '', priority: 'medium',
            dueDate: undefined, links: [], attachments: [], isUrgent: false,
        }]);
    };

    const updateItem = (id: string, updates: Partial<HandoverItemInput>) => {
        onItemsChange(items.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    const removeItem = (id: string) => onItemsChange(items.filter(item => item.id !== id));

    const moveItem = (index: number, dir: 'up' | 'down') => {
        const arr = [...items];
        const target = dir === 'up' ? index - 1 : index + 1;
        if (target < 0 || target >= arr.length) return;
        [arr[index], arr[target]] = [arr[target], arr[index]];
        onItemsChange(arr);
    };

    const highCount = items.filter(i => i.priority === 'high' && i.title.trim()).length;
    const validCount = items.filter(i => i.title.trim()).length;

    return (
        <div className="space-y-4">

            {/* Toggle */}
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">Übergabe erstellen</span>
                        {recommendHandover && (
                            <span className="text-xs text-blue-600 font-medium bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                Empfohlen
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {enabled
                            ? substituteName
                                ? `Aufgaben & Hinweise für ${substituteName} hinterlassen`
                                : 'Aufgaben & Hinweise für Ihre Vertretung hinterlassen'
                            : 'Keine Übergabe — Vertretung erhält keine Aufgaben'}
                    </p>
                </div>
                <ToggleSwitch checked={enabled} onChange={onToggle} />
            </div>

            {/* Content */}
            {enabled && (
                <div className="space-y-3">

                    {/* Stats */}
                    {validCount > 0 && (
                        <div className="flex items-center gap-3 text-xs text-gray-500 px-1">
                            <span><span className="font-semibold text-gray-700">{validCount}</span> Aufgabe{validCount !== 1 ? 'n' : ''}</span>
                            {highCount > 0 && (
                                <>
                                    <span className="text-gray-300">·</span>
                                    <span className="text-red-600 font-medium">{highCount} hohe Priorität</span>
                                </>
                            )}
                            <span className="ml-auto text-gray-400">Reihenfolge per ↑↓ ändern</span>
                        </div>
                    )}

                    {/* Task Cards */}
                    {items.map((item, index) => (
                        <TaskCard
                            key={item.id}
                            item={item}
                            index={index}
                            total={items.length}
                            onUpdate={(updates) => updateItem(item.id, updates)}
                            onRemove={() => removeItem(item.id)}
                            onMoveUp={() => moveItem(index, 'up')}
                            onMoveDown={() => moveItem(index, 'down')}
                        />
                    ))}

                    {/* Add Task */}
                    <button type="button" onClick={addItem}
                        className="w-full py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Aufgabe hinzufügen
                    </button>

                    {/* General Notes */}
                    <div className="p-4 bg-white rounded-xl border border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Allgemeine Hinweise</label>
                        <textarea
                            value={generalNotes}
                            onChange={(e) => onGeneralNotesChange(e.target.value)}
                            rows={3}
                            placeholder="Laufende Projekte, wichtige Kontakte, allgemeine Informationen..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    {/* Emergency Contact */}
                    <div className="p-4 bg-white rounded-xl border border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Erreichbarkeit während der Abwesenheit</label>
                        <div className="space-y-2">
                            {([
                                { value: 'unavailable', label: 'Nicht erreichbar', desc: 'Keine Kontaktaufnahme' },
                                { value: 'emergency_only', label: 'Nur echte Notfälle', desc: 'Nur bei kritischen Problemen' },
                                { value: 'limited_email', label: 'Eingeschränkt per E-Mail', desc: 'Gelegentlich E-Mails lesen' },
                            ] as const).map((opt) => (
                                <label key={opt.value}
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all ${emergencyContact.availability === opt.value
                                            ? 'border-blue-300 bg-blue-50'
                                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                        }`}>
                                    <input type="radio" name="availability" value={opt.value}
                                        checked={emergencyContact.availability === opt.value}
                                        onChange={() => onEmergencyContactChange({ ...emergencyContact, availability: opt.value })}
                                        className="w-4 h-4 text-blue-600" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-800">{opt.label}</div>
                                        <div className="text-xs text-gray-500">{opt.desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {emergencyContact.availability === 'emergency_only' && (
                            <div className="mt-3 space-y-2">
                                <input type="tel" value={emergencyContact.phone || ''}
                                    onChange={(e) => onEmergencyContactChange({ ...emergencyContact, phone: e.target.value })}
                                    placeholder="Telefonnummer für Notfälle *"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                <input type="text" value={emergencyContact.note || ''}
                                    onChange={(e) => onEmergencyContactChange({ ...emergencyContact, note: e.target.value })}
                                    placeholder="Zusätzliche Hinweise (optional)"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        )}
                        {emergencyContact.availability === 'limited_email' && (
                            <div className="mt-3">
                                <input type="text" value={emergencyContact.note || ''}
                                    onChange={(e) => onEmergencyContactChange({ ...emergencyContact, note: e.target.value })}
                                    placeholder="z.B. Antworte innerhalb von 48h (optional)"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
}