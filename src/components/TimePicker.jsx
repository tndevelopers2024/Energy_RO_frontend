import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const TimePicker = ({ value, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState({});
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);

    // Initial state parsing
    const parseTime = (timeStr) => {
        if (!timeStr) return { hour: '12', minute: '00', period: 'AM' };
        
        if (timeStr.includes(':') && !timeStr.includes(' ')) {
            let [h, m] = timeStr.split(':');
            h = parseInt(h);
            const period = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;
            return { hour: h.toString().padStart(2, '0'), minute: m, period };
        }

        const match = timeStr.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
        if (match) {
            return { hour: match[1].padStart(2, '0'), minute: match[2], period: match[3].toUpperCase() };
        }
        
        return { hour: '12', minute: '00', period: 'AM' };
    };

    const [tempTime, setTempTime] = useState(parseTime(value));

    useEffect(() => {
        setTempTime(parseTime(value));
    }, [value]);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event) => {
            if (
                triggerRef.current && !triggerRef.current.contains(event.target) &&
                dropdownRef.current && !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleToggle = () => {
        if (!isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const pickerHeight = 280;
            const pickerWidth = 240;
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            let top;
            if (spaceBelow >= pickerHeight || spaceBelow >= spaceAbove) {
                top = rect.bottom + 8;
            } else {
                top = rect.top - pickerHeight - 8;
            }

            // Center relative to trigger if possible
            let left = rect.left + (rect.width / 2) - (pickerWidth / 2);
            if (left < 10) left = 10;
            if (left + pickerWidth > window.innerWidth - 10) left = window.innerWidth - pickerWidth - 10;

            setDropdownStyle({
                position: 'fixed',
                top,
                left,
                width: pickerWidth,
                zIndex: 9999,
            });
        }
        setIsOpen(prev => !prev);
    };

    const updateTime = (updates) => {
        const newTime = { ...tempTime, ...updates };
        setTempTime(newTime);
        onChange(`${newTime.hour}:${newTime.minute} ${newTime.period}`);
    };

    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => (i * 1).toString().padStart(2, '0'));

    const scrollbarStyle = `
        .custom-time-scroll::-webkit-scrollbar {
            width: 3px;
        }
        .custom-time-scroll::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-time-scroll::-webkit-scrollbar-thumb {
            background: #e5e7eb;
            border-radius: 10px;
        }
        .custom-time-scroll:hover::-webkit-scrollbar-thumb {
            background: #D15616;
        }
    `;

    const dropdown = (
        <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="bg-white border border-gray-100 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5"
        >
            <style>{scrollbarStyle}</style>
            <div className="flex gap-3 justify-between">
                {/* Hours Column */}
                <div className="flex-1">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">Hour</p>
                    <div className="h-44 overflow-y-auto custom-time-scroll space-y-1 pr-1">
                        {hours.map(h => (
                            <button
                                key={h}
                                type="button"
                                onClick={() => updateTime({ hour: h })}
                                className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    tempTime.hour === h 
                                        ? 'bg-[#D15616] text-white shadow-md shadow-[#D15616]/20' 
                                        : 'hover:bg-gray-50 text-gray-600'
                                }`}
                            >
                                {h}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Minutes Column */}
                <div className="flex-1">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">Min</p>
                    <div className="h-44 overflow-y-auto custom-time-scroll space-y-1 pr-1">
                        {minutes.map(m => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => updateTime({ minute: m })}
                                className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    tempTime.minute === m 
                                        ? 'bg-[#0c1f3d] text-white shadow-md shadow-[#0c1f3d]/20' 
                                        : 'hover:bg-gray-50 text-gray-600'
                                }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Period Column */}
                <div className="flex flex-col gap-1.5 pt-6">
                    {['AM', 'PM'].map(p => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => updateTime({ period: p })}
                            className={`px-3 py-2 rounded-lg text-[9px] font-black tracking-widest transition-all ${
                                tempTime.period === p 
                                    ? 'bg-orange-50 text-[#D15616] border border-[#D15616]/20 shadow-sm' 
                                    : 'bg-gray-50 text-gray-400 border border-transparent hover:bg-gray-100'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-50 flex justify-end">
                <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2 bg-[#D15616] text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-[#D15616]/20 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
                >
                    Done
                </button>
            </div>
        </div>
    );

    return (
        <div className="relative w-full">
            {label && (
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
                    {label}
                </label>
            )}
            <div
                ref={triggerRef}
                onClick={handleToggle}
                className={`w-full px-4 py-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer group ${
                    isOpen 
                        ? 'bg-white border-[#D15616] shadow-lg shadow-[#D15616]/5' 
                        : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                }`}
            >
                <div className="flex items-center gap-3">
                    {/* <div className={`p-1.5 rounded-lg transition-colors ${isOpen ? 'bg-orange-50 text-[#D15616]' : 'bg-white text-gray-300'}`}>
                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="3" fill="none">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div> */}
                    <div>
                        <span className={`text-[13px] font-black tracking-tight block ${value ? 'text-[#0c1f3d]' : 'text-gray-300'}`}>
                            {value || 'Select Time'}
                        </span>
                    </div>
                </div>
                <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#D15616]' : 'text-gray-300'}`}>
                    <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" strokeWidth="4" fill="none">
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </div>
            </div>

            {isOpen && createPortal(dropdown, document.body)}
        </div>
    );
};

export default TimePicker;
