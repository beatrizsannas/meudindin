import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{
    left: number;
    top?: number;
    bottom?: number;
    showAbove: boolean;
  }>({ left: 0, top: 0, showAbove: false });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Parse current value
  const [initialYear, initialMonth] = value
    ? value.split('-').map(Number)
    : [new Date().getFullYear(), new Date().getMonth() + 1];

  const [viewYear, setViewYear] = useState(initialYear || new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState((initialMonth ? initialMonth - 1 : new Date().getMonth()));

  // Sync view when value changes
  useEffect(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      if (y && m) {
        setViewYear(y);
        setViewMonth(m - 1);
      }
    }
  }, [value]);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 16;
      const spaceAbove = rect.top - 16;

      const showAbove = spaceBelow < 330 && spaceAbove > spaceBelow;

      const pickerWidth = 288; // w-72 = 18rem = 288px
      let left = rect.left;
      if (left + pickerWidth > window.innerWidth - 12) {
        left = Math.max(12, window.innerWidth - pickerWidth - 12);
      }
      if (left < 12) left = 12;

      setCoords({
        left,
        top: rect.bottom + 6,
        bottom: window.innerHeight - rect.top + 6,
        showAbove,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mStr = (viewMonth + 1).toString().padStart(2, '0');
    const dStr = day.toString().padStart(2, '0');
    onChange(`${viewYear}-${mStr}-${dStr}`);
    setIsOpen(false);
  };

  const setToday = () => {
    const now = new Date();
    const yStr = now.getFullYear();
    const mStr = (now.getMonth() + 1).toString().padStart(2, '0');
    const dStr = now.getDate().toString().padStart(2, '0');
    onChange(`${yStr}-${mStr}-${dStr}`);
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setIsOpen(false);
  };

  const setTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yStr = tomorrow.getFullYear();
    const mStr = (tomorrow.getMonth() + 1).toString().padStart(2, '0');
    const dStr = tomorrow.getDate().toString().padStart(2, '0');
    onChange(`${yStr}-${mStr}-${dStr}`);
    setViewYear(tomorrow.getFullYear());
    setViewMonth(tomorrow.getMonth());
    setIsOpen(false);
  };

  // Format display text DD/MM/YYYY
  const displayDate = value ? (() => {
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
  })() : 'Selecionar data';

  // Today check
  const now = new Date();
  const isCurrentMonthToday = now.getFullYear() === viewYear && now.getMonth() === viewMonth;
  const todayDay = now.getDate();

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          updatePosition();
          setIsOpen(prev => !prev);
        }}
        className="flex items-center justify-between w-full h-11 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-xl px-3.5 text-sm font-semibold text-gray-800 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all hover:border-gray-300 dark:hover:border-white/20"
      >
        <div className="flex items-center gap-2 truncate">
          <span className="material-symbols-outlined text-emerald-700 dark:text-primary text-[20px] shrink-0">
            calendar_today
          </span>
          <span className="font-medium text-[#111814] dark:text-white">{displayDate}</span>
        </div>
        <span className="material-symbols-outlined text-gray-400 text-[18px]">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Popover Calendar via Portal to avoid any clipping from parent overflow */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            left: `${coords.left}px`,
            ...(coords.showAbove ? { bottom: `${coords.bottom}px` } : { top: `${coords.top}px` }),
          }}
          className="z-[9999] w-72 bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-4 animate-dropdown"
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAYS.map((wd, i) => (
              <span key={i} className="text-[11px] font-bold text-gray-400 dark:text-gray-500 py-1">
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty slots before first day of month */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="size-8" />
            ))}

            {/* Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dStr = day.toString().padStart(2, '0');
              const mStr = (viewMonth + 1).toString().padStart(2, '0');
              const isSelected = value === `${viewYear}-${mStr}-${dStr}`;
              const isToday = isCurrentMonthToday && day === todayDay;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`size-8 text-xs font-bold rounded-xl flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-primary text-[#0a2018] shadow-sm scale-105'
                      : isToday
                      ? 'border border-primary text-emerald-700 dark:text-primary'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-white/10 hover:text-emerald-700 dark:hover:text-primary'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick actions footer */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={setToday}
              className="text-xs font-bold text-emerald-700 dark:text-primary hover:underline px-2 py-1"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={setTomorrow}
              className="text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-2 py-1"
            >
              Amanhã
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
