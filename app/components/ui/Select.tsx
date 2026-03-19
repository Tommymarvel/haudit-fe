'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  menuClassName?: string;
  optionClassName?: string;
};

export function Select({
  value,
  onChange,
  options,
  placeholder,
  className,
  menuClassName,
  optionClassName,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocumentClick);
    return () => document.removeEventListener('mousedown', onDocumentClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 pr-8 text-left text-sm text-neutral-700 outline-none transition focus:border-[#7B00D4] focus:ring-1 focus:ring-[#7B00D4]',
          className,
        )}
      >
        <span className={cn(!selectedOption && 'text-neutral-400')}>
          {selectedOption?.label ?? placeholder ?? ''}
        </span>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black" />
      </button>

      {open && (
        <div
          className={cn(
            'absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-lg',
            menuClassName,
          )}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                onClick={() => {
                  if (option.disabled) return;
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  'block w-full px-3 py-2 text-left text-sm transition-colors',
                  option.disabled
                    ? 'cursor-not-allowed text-neutral-400'
                    : isSelected
                      ? 'bg-[#7B00D4] text-white'
                      : 'text-neutral-700 hover:bg-[#7B00D4] hover:text-white',
                  optionClassName,
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
