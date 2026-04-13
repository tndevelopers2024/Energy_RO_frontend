import React, { useState, useEffect, useRef } from 'react';

const DEFAULT_VISIT_TYPES = [
    { code: 'MS', label: 'Mandatory Service' },
    { code: 'CS', label: 'Contract Service' },
    { code: 'C',  label: 'Complaints' },
    { code: 'SV', label: 'Site Visit' },
    { code: 'RC', label: 'Regeneration Calls' },
    { code: 'I',  label: 'Installation' },
    { code: 'CC', label: 'Contract Collection' },
];

const STORAGE_KEY = 'custom_visit_types';

const VisitTypeSelect = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [customTypes, setCustomTypes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            setCustomTypes(saved);
        } catch {
            setCustomTypes([]);
        }
    }, []);

    // When value changes externally, clear search
    useEffect(() => {
        setSearchTerm('');
    }, [value]);

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const allOptions = [
        ...DEFAULT_VISIT_TYPES,
        ...customTypes.map(c => ({ code: c, label: c })),
    ];

    const filtered = searchTerm.trim()
        ? allOptions.filter(o =>
            o.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : allOptions;

    const isQueryNew = searchTerm.trim() &&
        !allOptions.some(o => o.code.toLowerCase() === searchTerm.trim().toLowerCase());

    const selectedOption = allOptions.find(o => o.code === value);
    const displayValue = selectedOption ? `${selectedOption.code} - ${selectedOption.label}` : '';

    const handleInputChange = (e) => {
        setSearchTerm(e.target.value);
        if (!isOpen) setIsOpen(true);
    };

    const handleSelect = (code) => {
        onChange(code);
        setSearchTerm('');
        setIsOpen(false);
    };

    const addCustomType = () => {
        const newCode = searchTerm.trim().toUpperCase();
        if (!newCode) return;
        const updated = [...customTypes, newCode];
        setCustomTypes(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        onChange(newCode);
        setSearchTerm('');
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="relative group">
                <input
                    type="text"
                    value={isOpen ? searchTerm : displayValue}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Search or type visit type..."
                    className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg focus:outline-none focus:ring-4 focus:ring-[#D15616]/10 focus:border-[#D15616] transition-all text-sm font-semibold text-gray-700 placeholder:text-gray-300 placeholder:font-medium"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#D15616] transition-colors pointer-events-none">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none">
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </div>
            </div>

            {isOpen && (
                <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-[1100] bg-white border border-gray-100 rounded-xl shadow-2xl shadow-gray-200/50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 scrollbar-thin scrollbar-thumb-gray-100">
                    <div className="p-2 space-y-0.5">
                        {filtered.length > 0 ? (
                            filtered.map(opt => (
                                <button
                                    key={opt.code}
                                    type="button"
                                    onClick={() => handleSelect(opt.code)}
                                    className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                                        value === opt.code
                                            ? 'bg-[#D15616] text-white'
                                            : 'text-gray-600 hover:bg-[#D15616]/5 hover:text-[#D15616]'
                                    }`}
                                >
                                    <span>
                                        <span className="font-black">{opt.code}</span>
                                        {opt.label !== opt.code && <span className="opacity-70"> – {opt.label}</span>}
                                    </span>
                                    {value === opt.code && (
                                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="4" fill="none">
                                            <path d="M20 6L9 17l-5-5" />
                                        </svg>
                                    )}
                                </button>
                            ))
                        ) : !isQueryNew ? (
                            <div className="px-4 py-4 text-center text-[10px] font-bold text-gray-400">
                                No visit types found
                            </div>
                        ) : null}

                        {isQueryNew && (
                            <button
                                type="button"
                                onClick={addCustomType}
                                className="cursor-pointer w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 text-[#D15616] hover:bg-[#D15616]/5 border-t border-gray-50 mt-1 pt-2"
                            >
                                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="3" fill="none">
                                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Add "{searchTerm.trim().toUpperCase()}" as new type
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisitTypeSelect;
