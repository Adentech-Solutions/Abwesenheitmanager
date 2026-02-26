'use client';

import React, { useState, useEffect, useRef } from 'react';

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
        <div ref={wrapperRef} className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                Vertretung (optional)
            </label>

            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
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
                    className={`w-full pl-10 pr-10 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${selectedMember
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-300 bg-white'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                />

                {selectedMember && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Selected indicator */}
            {selectedMember && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-700">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{selectedMember.name}</span>
                    {selectedMember.department && (
                        <span className="text-green-600">· {selectedMember.department}</span>
                    )}
                </div>
            )}

            {/* Dropdown */}
            {isOpen && !selectedMember && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            Laden...
                        </div>
                    ) : results.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            Keine Ergebnisse gefunden
                        </div>
                    ) : (
                        results.map((member) => (
                            <button
                                key={member.userId}
                                type="button"
                                onClick={() => handleSelect(member)}
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3 border-b border-gray-50 last:border-b-0"
                            >
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                                    {member.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-medium text-gray-900 text-sm truncate">
                                        {member.name}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                        {member.email}
                                        {member.department && ` · ${member.department}`}
                                        {member.jobTitle && ` · ${member.jobTitle}`}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
