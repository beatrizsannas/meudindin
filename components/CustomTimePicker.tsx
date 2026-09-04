import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface CustomTimePickerProps {
  value: string; // HH:mm
  onChange: (value: string) => void;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
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

  const [currentHour, currentMinute] = value && value.includes(':')
    ? value.split(':')
    : ['09', '00'];

  const [selectedHour, setSelectedHour] = useState(currentHour || '09');
  const [selectedMinute, setSelectedMinute] = useState(currentMinute || '00');

  useEffect(() => {
    if (value && value.includes(':')) {
      const [h, m] = value.split(':');
      setSelectedHour(h);
      setSelectedMinute(m);
    }
  }, [value]);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 16;
      const spaceAbove = rect.top - 16;

      const showAbove = spaceBelow < 280 && spaceAbove > spaceBelow;

      const pickerWidth = 240; // w-60 = 240px
      // Align right with the trigger button if possible
      let left = rect.right - pickerWidth;
      if (left + pickerWidth > window.innerWidth - 12) {
        left = window.innerWidth - pickerWidth - 12;
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

  const handleHourSelect = (h: string) => {
    setSelectedHour(h);
    onChange(`${h}:${selectedMinute}`);
  };

  const handleMinuteSelect = (m: string) => {
    setSelectedMinute(m);
    onChange(`${selectedHour}:${m}`);
  };

  const handleConfirm = () => {
    onChange(`${selectedHour}:${selectedMinute}`);
    setIsOpen(false);
  };

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
            schedule
          </span>
          <span className="font-medium text-[#111814] dark:text-white">{value || '09:00'}</span>
        </div>
        <span className="material-symbols-outlined text-gray-400 text-[18px]">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Popover via Portal */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            left: `${coords.left}px`,
            ...(coords.showAbove ? { bottom: `${coords.bottom}px` } : { top: `${coords.top}px` }),
          }}
          className="z-[9999] w-60 bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-3 animate-dropdown"
        >
          <div className="text-center text-xs font-bold text-gray-700 dark:text-gray-200 pb-2 border-b border-gray-100 dark:border-gray-800">
            Definir Horário ({selectedHour}:{selectedMinute})
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            {/* Hours Column */}
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 text-center mb-1">
                Hora
              </span>
              <div className="max-h-44 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
                {HOURS.map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleHourSelect(h)}
                    className={`h-8 rounded-lg text-xs font-bold transition-colors ${
                      selectedHour === h
                        ? 'bg-primary text-[#0a2018] shadow-sm'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-white/5 hover:text-emerald-700 dark:hover:text-primary'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes Column */}
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 text-center mb-1">
                Minuto
              </span>
              <div className="max-h-44 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
                {MINUTES.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMinuteSelect(m)}
                    className={`h-8 rounded-lg text-xs font-bold transition-colors ${
                      selectedMinute === m
                        ? 'bg-primary text-[#0a2018] shadow-sm'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-white/5 hover:text-emerald-700 dark:hover:text-primary'
                    }`}
                  >
                    :{m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full h-8 bg-primary hover:bg-primary-dark text-[#0a2018] font-bold text-xs rounded-lg transition-colors shadow-sm"
            >
              OK
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
