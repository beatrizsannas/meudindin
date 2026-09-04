import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface SelectOption {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  icon?: string;
  minWidth?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  className = '',
  icon,
  minWidth = 'min-w-[120px]',
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{
    left: number;
    top?: number;
    bottom?: number;
    width: number;
    maxHeight: number;
    showAbove: boolean;
  }>({ left: 0, top: 0, width: 0, maxHeight: 240, showAbove: false });

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find(o => String(o.value) === String(value))?.label ?? String(value);

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 16;
      const spaceAbove = rect.top - 16;

      const showAbove = spaceBelow < 180 && spaceAbove > spaceBelow;
      const maxH = showAbove
        ? Math.min(260, Math.max(120, spaceAbove))
        : Math.min(260, Math.max(120, spaceBelow));

      if (showAbove) {
        setCoords({
          left: rect.left,
          bottom: window.innerHeight - rect.top + 6,
          width: rect.width,
          maxHeight: maxH,
          showAbove: true,
        });
      } else {
        setCoords({
          left: rect.left,
          top: rect.bottom + 6,
          width: rect.width,
          maxHeight: maxH,
          showAbove: false,
        });
      }
    }
  };

  useEffect(() => {
    if (open) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open && dropdownRef.current) {
      const selectedEl = dropdownRef.current.querySelector('[aria-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${minWidth} ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 w-full h-10 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-xl px-3 text-sm font-bold text-gray-700 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {icon && (
          <span className="material-symbols-outlined text-emerald-700 dark:text-primary text-[18px] shrink-0">{icon}</span>
        )}
        <span className="flex-1 text-left truncate">{selectedLabel}</span>
        <span
          className={`material-symbols-outlined text-gray-500 dark:text-gray-400 text-[20px] shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          expand_more
        </span>
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            ...(coords.showAbove ? { bottom: coords.bottom } : { top: coords.top }),
            left: coords.left,
            width: coords.width,
            maxHeight: `${coords.maxHeight}px`,
          }}
          className="z-[9999] bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl overflow-y-auto custom-scrollbar animate-dropdown py-1"
          role="listbox"
        >
          {options.map(opt => {
            const isSelected = String(opt.value) === String(value);
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(String(opt.value));
                  setOpen(false);
                }}
                className={`flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium text-left transition-colors ${
                  isSelected
                    ? 'bg-primary/10 dark:bg-primary/15 text-emerald-800 dark:text-primary font-bold'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <span className="material-symbols-outlined text-emerald-700 dark:text-primary text-[18px]">check</span>
                )}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
};
