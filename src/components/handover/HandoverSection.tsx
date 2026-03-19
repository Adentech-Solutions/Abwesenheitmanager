'use client';

// src/components/handover/HandoverSection.tsx

import React, { useState, useRef } from 'react';
import { 
    Plus, Trash2, ClipboardList, Info, ChevronUp, ChevronDown, 
    AlertTriangle, Paperclip, Link as LinkIcon, AlertCircle, 
    Calendar, CheckCircle2, Star, Sparkles, MessageSquare, Phone, XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

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
    badgeVariant: 'success' | 'warning' | 'danger' | 'default';
}> = {
    high: { label: 'Hoch', activeClass: 'bg-rose-50 border-rose-300 text-rose-700', dotClass: 'bg-rose-500', badgeVariant: 'danger' },
    medium: { label: 'Mittel', activeClass: 'bg-amber-50 border-amber-300 text-amber-700', dotClass: 'bg-amber-400', badgeVariant: 'warning' },
    low: { label: 'Niedrig', activeClass: 'bg-emerald-50 border-emerald-300 text-emerald-700', dotClass: 'bg-emerald-500', badgeVariant: 'success' },
};

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

    return (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden animate-in slide-in-from-left-4 duration-300 group">
            {/* Header */}
            <div className="flex items-center gap-3.5 px-5 py-4 bg-white/50 border-b border-gray-50 group-hover:bg-primary-50/10 transition-colors">
                {/* Drag dots placeholder */}
                <div className="flex flex-col gap-0.5 cursor-grab text-gray-200 flex-shrink-0">
                    {[0, 1].map(i => (
                        <div key={i} className="flex gap-0.5">
                            <div className="w-1 h-1 rounded-full bg-current" />
                            <div className="w-1 h-1 rounded-full bg-current" />
                        </div>
                    ))}
                </div>

                {/* Status Indicator */}
                <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse", cfg.dotClass)} />

                {/* Title */}
                <span className="flex-1 text-sm font-bold text-gray-900 tracking-tight leading-none truncate">
                    {item.title || `Vorgang ${index + 1}`}
                </span>

                {/* Move up/down */}
                <div className="flex gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={onMoveUp} disabled={index === 0}
                        className="h-8 w-8 p-0 rounded-lg border border-gray-100 bg-white shadow-xs">
                        <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onMoveDown} disabled={index === total - 1}
                        className="h-8 w-8 p-0 rounded-lg border border-gray-100 bg-white shadow-xs">
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </div>

                {/* Expand */}
                <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}
                    className="h-8 w-8 p-0 rounded-lg border border-gray-100 bg-white shadow-xs">
                    <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", expanded ? "rotate-180" : "")} />
                </Button>

                {/* Remove */}
                <Button variant="ghost" size="sm" onClick={onRemove}
                    className="h-8 w-8 p-0 rounded-lg text-rose-300 hover:text-rose-600 hover:bg-rose-50 border border-gray-100 bg-white shadow-xs">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {/* Body */}
            {expanded && (
                <div className="p-6 space-y-6">
                    {/* Title input */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Bezeichnung des Vorgangs *</label>
                        <input
                            type="text"
                            value={item.title}
                            onChange={(e) => onUpdate({ title: e.target.value })}
                            placeholder="z.B. Monatliche Abrechnung abschließen"
                            className="w-full h-11 px-4 py-3 border border-gray-100 rounded-xl bg-white font-bold text-gray-700 shadow-sm focus:border-primary-500 transition-all outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Priority Selector */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Priorität</label>
                            <div className="flex gap-2">
                                {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG[Priority]][]).map(([p, pCfg]) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => onUpdate({ priority: p, isUrgent: p === 'high' })}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-tight border shadow-xs transition-all",
                                            item.priority === p 
                                                ? pCfg.activeClass 
                                                : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                                        )}
                                    >
                                        <div className={cn("w-1.5 h-1.5 rounded-full", item.priority === p ? pCfg.dotClass : "bg-gray-200")} />
                                        {pCfg.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Fällig bis (optional)</label>
                            <div className="relative">
                                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                                <input
                                    type="date"
                                    value={item.dueDate || ''}
                                    onChange={(e) => onUpdate({ dueDate: e.target.value || undefined })}
                                    className="w-full h-11 pl-10 pr-4 py-3 border border-gray-100 rounded-xl bg-white font-bold text-gray-700 shadow-sm focus:border-primary-500 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Detaillierte Anweisungen</label>
                        <textarea
                            value={item.description}
                            onChange={(e) => onUpdate({ description: e.target.value })}
                            placeholder="Beschreiben Sie hier genau, was zu tun ist..."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-100 rounded-xl bg-white font-bold text-gray-700 shadow-sm focus:border-primary-500 transition-all outline-none resize-none"
                        />
                    </div>

                    {/* Links */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                            <LinkIcon className="h-3 w-3" /> Verknüpfungen
                        </label>
                        <div className="space-y-2">
                            {item.links.map((link, idx) => (
                                <div key={idx} className="flex gap-2 items-center group/link">
                                    <input
                                        type="text"
                                        value={link.title}
                                        onChange={(e) => {
                                            const updated = [...item.links];
                                            updated[idx] = { ...updated[idx], title: e.target.value };
                                            onUpdate({ links: updated });
                                        }}
                                        placeholder="Titel (z.B. Wiki)"
                                        className="flex-[0.4] h-10 px-3 border border-gray-100 rounded-lg text-xs font-bold focus:border-primary-500 outline-none"
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
                                        className="flex-1 h-10 px-3 border border-gray-100 rounded-lg text-xs font-bold focus:border-primary-500 outline-none"
                                    />
                                    <Button variant="ghost" size="sm" onClick={() => onUpdate({ links: item.links.filter((_, i) => i !== idx) })}
                                        className="h-8 w-8 p-0 text-gray-300 hover:text-rose-500">
                                        <XCircle className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            <button type="button"
                                onClick={() => onUpdate({ links: [...item.links, { title: '', url: '' }] })}
                                className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-700 flex items-center gap-1.5 group">
                                <Plus className="h-3 w-3 group-hover:scale-110 transition-transform" /> Link hinzufügen
                            </button>
                        </div>
                    </div>

                    {/* Attachments */}
                    <div className="space-y-3 pt-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                            <Paperclip className="h-3 w-3" /> Anhänge
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {item.attachments.map((att, idx) => (
                                <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50/50 border border-gray-100 rounded-xl text-[10px] font-bold">
                                    <span className="text-gray-900 truncate max-w-[120px]">{att.name}</span>
                                    <span className="text-gray-400 tabular-nums">{formatSize(att.size)}</span>
                                    <button type="button" onClick={() => onUpdate({ attachments: item.attachments.filter((_, i) => i !== idx) })}
                                        className="text-gray-300 hover:text-rose-500 ml-1">
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={() => fileInputRef.current?.click()}
                                className="px-3 py-1.5 border border-dashed border-gray-200 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-primary-200 hover:text-primary-600 hover:bg-primary-50/10 transition-all flex items-center gap-1.5">
                                <Plus className="h-3 w-3" /> Datei wählen
                            </button>
                            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg" />
                        </div>
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
        <div className="space-y-6 animate-in fade-in duration-500 delay-200">

            {/* Premium Toggle Header */}
            <Card className={cn(
                "p-6 flex items-center justify-between border-gray-100 shadow-sm transition-all duration-500",
                enabled ? "bg-primary-50/5 border-primary-100" : "bg-white"
            )}>
                <div className="flex items-center gap-5">
                    <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm border transition-all duration-500",
                        enabled ? "bg-primary-600 border-primary-500 text-white" : "bg-gray-50 border-gray-100 text-gray-400"
                    )}>
                        <ClipboardList className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                             <h3 className="text-base font-black text-gray-900 tracking-tight leading-none">Übergabe-Protokoll</h3>
                             {recommendHandover && (
                                <Badge className="bg-amber-50 text-amber-700 border-amber-100 font-black text-[9px] px-2 py-0.5 rounded-lg uppercase">
                                    <Star className="h-2 w-2 mr-1 animate-pulse fill-current" /> Empfohlen
                                </Badge>
                             )}
                        </div>
                        <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            {enabled 
                                ? (substituteName ? `Briefing für ${substituteName}` : "Anweisungen für die Vertretung")
                                : "Keine Aufgaben hinterlegt"}
                        </p>
                    </div>
                </div>
                
                {/* Custom Branded Toggle */}
                <button 
                  type="button" 
                  onClick={() => onToggle(!enabled)}
                  className={cn(
                    "relative w-14 h-8 rounded-full transition-all duration-300 shadow-inner overflow-hidden",
                    enabled ? "bg-primary-600" : "bg-gray-100"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-xl transition-all duration-300 flex items-center justify-center",
                    enabled ? "translate-x-6" : "translate-x-0"
                  )}>
                    <div className={cn("w-1.5 h-1.5 rounded-full", enabled ? "bg-primary-600" : "bg-gray-200")} />
                  </div>
                </button>
            </Card>

            {/* Full Handover Wizard Content */}
            {enabled && (
                <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
                    
                    {/* Tasks Container */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2.5">
                                <Sparkles className="h-4 w-4 text-primary-500" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Offene Aufgaben ({validCount})</span>
                            </div>
                            {highCount > 0 && (
                                <Badge variant="danger" className="font-black text-[8px] tracking-widest border-none">
                                    {highCount} KRITISCH
                                </Badge>
                            )}
                        </div>

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

                        <Button 
                            variant="ghost" 
                            onClick={addItem}
                            className="w-full h-14 border-2 border-dashed border-gray-100 hover:border-primary-200 hover:bg-primary-50/10 hover:text-primary-700 text-gray-400 rounded-2xl flex items-center justify-center gap-2.5 font-black uppercase tracking-widest text-[10px] transition-all group"
                        >
                            <Plus className="h-4 w-4 group-hover:scale-125 transition-transform" /> 
                            Aufgabe hinzufügen
                        </Button>
                    </div>

                    {/* General Notes Section */}
                    <Card className="p-8 border-gray-100 shadow-sm bg-gray-50/30">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <MessageSquare className="h-6 w-6 text-primary-500" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Allgemeine Hinweise</h4>
                                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight">Übergreifendes Briefing & Kontext</p>
                            </div>
                        </div>
                        <textarea
                            value={generalNotes}
                            onChange={(e) => onGeneralNotesChange(e.target.value)}
                            rows={4}
                            placeholder="Projekte, Kontakte, Besonderheiten..."
                            className="w-full px-5 py-4 border border-gray-100 rounded-2xl bg-white font-bold text-gray-700 shadow-sm focus:border-primary-500 transition-all outline-none resize-none"
                        />
                    </Card>

                    {/* Emergency Contact Section */}
                    <Card className="p-8 border-gray-100 shadow-sm bg-gray-50/30">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <Phone className="h-6 w-6 text-primary-500" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Erreichbarkeit</h4>
                                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight">Verhalten im Notfall während der Abwesenheit</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {(['unavailable', 'emergency_only', 'limited_email'] as const).map((opt) => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => onEmergencyContactChange({ ...emergencyContact, availability: opt })}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all group",
                                        emergencyContact.availability === opt 
                                            ? "bg-primary-600 border-primary-500 text-white shadow-lg scale-105" 
                                            : "bg-white border-gray-50 text-gray-400 hover:border-gray-100 hover:bg-gray-50"
                                    )}
                                >
                                    <div className={cn(
                                        "p-2 rounded-xl mb-3",
                                        emergencyContact.availability === opt ? "bg-white/20" : "bg-gray-50 group-hover:bg-white"
                                    )}>
                                        {opt === 'unavailable' ? <XCircle className="h-5 w-5" /> : 
                                         opt === 'emergency_only' ? <AlertTriangle className="h-5 w-5" /> : 
                                         <Calendar className="h-5 w-5" />}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{
                                        opt === 'unavailable' ? 'Kein Kontakt' : 
                                        opt === 'emergency_only' ? 'Nur Notfall' : 'Eingeschränkt'
                                    }</span>
                                </button>
                            ))}
                        </div>

                        {emergencyContact.availability !== 'unavailable' && (
                            <div className="space-y-4 animate-in zoom-in-95 duration-300">
                                <div className="space-y-2">
                                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                        {emergencyContact.availability === 'emergency_only' ? 'Notfallnummer *' : 'Optionale Info'}
                                     </label>
                                     <input 
                                        type="tel" 
                                        value={emergencyContact.phone || ''}
                                        onChange={(e) => onEmergencyContactChange({ ...emergencyContact, phone: e.target.value })}
                                        placeholder={emergencyContact.availability === 'emergency_only' ? "+49 123..." : "Zusatzinfo..."}
                                        className="w-full h-11 px-4 border border-gray-100 rounded-xl bg-white font-bold text-gray-700 shadow-sm focus:border-primary-500 transition-all outline-none"
                                     />
                                </div>
                                <div className="space-y-2">
                                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Hinweis zur Erreichbarkeit</label>
                                     <input 
                                        type="text" 
                                        value={emergencyContact.note || ''}
                                        onChange={(e) => onEmergencyContactChange({ ...emergencyContact, note: e.target.value })}
                                        placeholder="z.B. Nur per Teams oder Handy erreichbar"
                                        className="w-full h-11 px-4 border border-gray-100 rounded-xl bg-white font-bold text-gray-700 shadow-sm focus:border-primary-500 transition-all outline-none"
                                     />
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
}