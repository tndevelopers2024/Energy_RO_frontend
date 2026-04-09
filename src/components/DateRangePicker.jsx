import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const DateRangePicker = ({ startDate, endDate, onRangeSelect, isSingle = false, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tempStart, setTempStart] = useState(startDate ? new Date(startDate) : null);
  const [tempEnd, setTempEnd] = useState(endDate ? new Date(endDate) : null);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Sync with props
  useEffect(() => {
    setTempStart(startDate ? new Date(startDate) : null);
    setTempEnd(endDate ? new Date(endDate) : null);
  }, [startDate, endDate]);

  // Click outside to close
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

  // Calculate position when opening
  const handleToggle = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const pickerHeight = 420;
      const pickerWidth = 320;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      let top, right;
      right = Math.max(8, window.innerWidth - rect.right);

      if (spaceBelow >= pickerHeight || spaceBelow >= spaceAbove) {
        // Open downward
        top = rect.bottom + 8;
        // Clamp to bottom of screen
        if (top + pickerHeight > window.innerHeight - 8) {
          top = window.innerHeight - pickerHeight - 8;
        }
      } else {
        // Open upward
        top = rect.top - pickerHeight - 8;
        // Clamp to top of screen
        if (top < 8) {
          top = 8;
        }
      }

      setDropdownStyle({
        position: 'fixed',
        top,
        right,
        zIndex: 9999,
      });
    }
    setIsOpen(prev => !prev);
  };


  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const handlePrevYear  = () => setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
  const handleNextYear  = () => setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));

  const handleDateClick = (day) => {
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    if (isSingle) {
      setTempStart(selectedDate);
      onRangeSelect(selectedDate, null);
      setIsOpen(false);
      return;
    }
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(selectedDate);
      setTempEnd(null);
    } else if (tempStart && !tempEnd) {
      if (selectedDate < tempStart) {
        setTempStart(selectedDate);
      } else {
        setTempEnd(selectedDate);
      }
    }
  };

  const handleApply = () => { onRangeSelect(tempStart, tempEnd); setIsOpen(false); };
  const handleClear = () => { setTempStart(null); setTempEnd(null); onRangeSelect(null, null); setIsOpen(false); };

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
  };
  const isSelected = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return (tempStart && date.getTime() === tempStart.getTime()) || (tempEnd && date.getTime() === tempEnd.getTime());
  };
  const isInRange = (day) => {
    if (!tempStart || !tempEnd) return false;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return date > tempStart && date < tempEnd;
  };

  const renderDays = () => {
    const totalDays = daysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const startDay = firstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }
    for (let day = 1; day <= totalDays; day++) {
      const selected = isSelected(day);
      const inRange = isInRange(day);
      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(day)}
          className={`h-9 w-9 text-[11px] font-black rounded-lg transition-all flex items-center justify-center relative cursor-pointer ${
            selected
              ? 'bg-[#D15616] text-white shadow-lg shadow-[#D15616]/20 z-10'
              : inRange
                ? 'bg-[#D15616]/10 text-[#D15616]'
                : isToday(day)
                  ? 'border border-[#D15616]/30 text-[#D15616] hover:bg-gray-50'
                  : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  const formatDateLabel = (date) => {
    if (!date) return null;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const dropdown = (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-white border border-gray-100 rounded-2xl p-5 w-[320px] shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-center justify-between mb-5 px-1 bg-gray-50/50 p-2 rounded-xl border border-gray-50">
        <div className="flex gap-0.5">
          <button type="button" onClick={handlePrevYear}  className="p-2 hover:bg-white hover:text-[#D15616] hover:shadow-sm rounded-lg text-gray-300 transition-all" title="Previous Year">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/></svg>
          </button>
          <button type="button" onClick={handlePrevMonth} className="p-2 hover:bg-white hover:text-[#D15616] hover:shadow-sm rounded-lg text-gray-400 transition-all" title="Previous Month">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        </div>

        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900">
          {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h4>

        <div className="flex gap-0.5">
          <button type="button" onClick={handleNextMonth} className="p-2 hover:bg-white hover:text-[#D15616] hover:shadow-sm rounded-lg text-gray-400 transition-all" title="Next Month">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          <button type="button" onClick={handleNextYear}  className="p-2 hover:bg-white hover:text-[#D15616] hover:shadow-sm rounded-lg text-gray-300 transition-all" title="Next Year">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none"><path d="M13 17l5-5-5-5M6 17l5-5-5-5"/></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="h-9 w-9 flex items-center justify-center text-[9px] font-black text-gray-300 uppercase tracking-widest">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {renderDays()}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
        <button type="button" onClick={handleClear} className="px-4 py-2 text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors">Clear</button>
        <div className="flex gap-2">
          <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors">Cancel</button>
          <button type="button" onClick={handleApply} className="px-6 py-2 bg-[#D15616] text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-[#D15616]/20 hover:scale-105 active:scale-95 transition-all">Apply</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`relative ${isSingle ? 'flex flex-col gap-1.5 w-full' : ''}`}>
      {isSingle && label && (
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          {label} <span className="text-[#D15616]">*</span>
        </label>
      )}

      {/* Trigger Area */}
      <div
        ref={triggerRef}
        onClick={handleToggle}
        className={`flex items-center bg-white border rounded-lg cursor-pointer transition-all shadow-sm group ${
          isOpen ? 'border-[#D15616] ring-4 ring-[#D15616]/5' : 'border-gray-100 hover:border-gray-200'
        }`}
      >
        <div className="flex items-center px-4 py-3 min-w-0 flex-1 justify-between">
          <div className="flex items-center gap-3">
            <svg className={`transition-colors flex-shrink-0 ${isOpen ? 'text-[#D15616]' : 'text-gray-300'}`} viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className={`text-sm font-semibold truncate ${tempStart ? 'text-gray-700' : 'text-gray-300'}`}>
              {formatDateLabel(tempStart) || (isSingle ? 'Click to select date' : 'Start Date')}
            </span>
          </div>

          {!isSingle && (
            <div className="flex items-center gap-3 border-l border-gray-50 pl-4">
              <span className="text-gray-100 font-bold">→</span>
              <span className={`text-sm font-semibold truncate ${tempEnd ? 'text-gray-700' : 'text-gray-300'}`}>
                {formatDateLabel(tempEnd) || 'End Date'}
              </span>
            </div>
          )}
        </div>
      </div>

      {isOpen && createPortal(dropdown, document.body)}
    </div>
  );
};

export default DateRangePicker;
