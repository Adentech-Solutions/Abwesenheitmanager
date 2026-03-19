'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Check, Users, MapPin, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';

interface TeamMember {
    userId: string;
    email: string;
    name: string;
    department?: string;
    jobTitle?: string;
}

interface SubstituteSearchProps {
    onSelect: (substitute: { userId: string; email: string; name: string }) => void;
    selectedEmail?: string;
    disabled?: boolean;
}

export default function SubstituteSearch({ onSelect, selectedEmail, disabled }: SubstituteSearchProps) {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [results, setResults] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Debounce query input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Fetch team members on mount AND when debounced query changes
    useEffect(() => {
        const fetchTeamMembers = async () => {
            try {
                setLoading(true);
                const url = debouncedQuery.trim()
                    ? `/api/users/team?q=${encodeURIComponent(debouncedQuery)}`
                    : '/api/users/team';

                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    setResults(data.members || []);

                    // If we have a selectedEmail but no selectedMember yet, try to set it from the initial fetch
                    if (selectedEmail && !selectedMember && !debouncedQuery) {
                        const member = data.members?.find((m: TeamMember) => m.email === selectedEmail);
                        if (member) {
                            setSelectedMember(member);
                            setQuery(member.name);
                        }
                    }
                }
            } catch (err) {
                console.error('Error fetching team members:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTeamMembers();
    }, [debouncedQuery, selectedEmail, selectedMember]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (member: TeamMember) => {
        setSelectedMember(member);
        setQuery(member.name);
        setIsOpen(false);
        onSelect({
            userId: member.userId,
            email: member.email,
            name: member.name,
        });
    };

    const handleClear = () => {
        setSelectedMember(null);
        setQuery('');
        setDebouncedQuery('');
        onSelect({ userId: '', email: '', name: '' });
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-2 block">
                Vertretung (optional)
            </label>

            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className={cn(
                        "w-4 h-4 transition-colors duration-200",
                        selectedMember ? "text-emerald-500" : "text-gray-400 group-focus-within:text-primary-500"
                    )} />
                </div>

                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                        if (selectedMember) setSelectedMember(null);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Name oder E-Mail suchen..."
                    disabled={disabled}
                    className={cn(
                        "w-full h-12 pl-11 pr-11 text-sm font-bold rounded-2xl border bg-white ring-offset-white transition-all duration-200 outline-none",
                        selectedMember 
                            ? "border-emerald-100 bg-emerald-50/30 text-emerald-900" 
                            : "border-gray-100 text-gray-700 placeholder:text-gray-300 placeholder:font-medium focus:border-primary-200 focus:ring-4 focus:ring-primary-50/50 focus:bg-white",
                        disabled && "opacity-50 cursor-not-allowed bg-gray-50"
                    )}
                />

                {selectedMember && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-emerald-500 hover:text-emerald-700 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
                
                {!selectedMember && loading && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                        <div className="w-4 h-4 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Selected indicator */}
            {selectedMember && (
                <div className="mt-3 flex items-center gap-2.5 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl animate-in zoom-in-95 duration-200">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-black text-emerald-700 uppercase tracking-tight">Bestätigt</span>
                    <span className="text-xs font-bold text-emerald-900 truncate flex-1">{selectedMember.name}</span>
                </div>
            )}

            {/* Dropdown */}
            {isOpen && !selectedMember && (
                <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-2xl shadow-gray-200/50 max-h-72 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {results.length} Teammitglieder gefunden
                        </span>
                        <Users className="h-3 w-3 text-gray-300" />
                    </div>
                    
                    <div className="overflow-y-auto custom-scrollbar flex-1">
                    {loading && results.length === 0 ? (
                        <div className="p-8 text-center">
                           <div className="w-8 h-8 border-2 border-primary-100 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Suche läuft...</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="p-8 text-center">
                            <Search className="h-8 w-8 text-gray-100 mx-auto mb-3" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Keine Übereinstimmung</p>
                        </div>
                    ) : (
                        <div className="p-1.5 space-y-1">
                        {results.map((member, idx) => (
                            <button
                                key={member.userId}
                                type="button"
                                onClick={() => handleSelect(member)}
                                className={cn(
                                    "group w-full text-left px-3 py-2.5 hover:bg-primary-50 rounded-xl transition-all flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300",
                                    `delay-${idx * 20}`
                                )}
                            >
                                <Avatar 
                                    name={member.name} 
                                    className="h-9 w-9 text-xs border-2 border-white shadow-sm ring-1 ring-gray-100" 
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="font-bold text-gray-900 text-sm tracking-tight group-hover:text-primary-700 transition-colors">
                                        {member.name}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium truncate">
                                            <Briefcase className="h-2.5 w-2.5" />
                                            {member.jobTitle || 'Mitarbeiter'}
                                        </div>
                                        {member.department && (
                                            <>
                                                <span className="text-gray-200 text-[10px]">·</span>
                                                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium truncate">
                                                    <MapPin className="h-2.5 w-2.5" />
                                                    {member.department}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="h-6 w-6 rounded-lg bg-white border border-primary-100 flex items-center justify-center">
                                        <Check className="h-3 w-3 text-primary-600" />
                                    </div>
                                </div>
                            </button>
                        ))}
                        </div>
                    )}
                    </div>
                </div>
            )}
        </div>
    );
}
