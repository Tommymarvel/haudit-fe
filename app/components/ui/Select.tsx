'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { createPortal } from 'react-dom';

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
  disabled?: boolean;
  className?: string;
  menuClassName?: string;
  optionClassName?: string;
};

export function Select({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  className,
  menuClassName,
  optionClassName,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const updateMenuPosition = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const menuMaxHeight = 240;
      const viewportPadding = 8;
      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
      const spaceAbove = rect.top - viewportPadding;
      const showAbove = spaceBelow < 180 && spaceAbove > spaceBelow;

      setMenuStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        zIndex: 120,
        maxHeight: menuMaxHeight,
        top: showAbove ? undefined : rect.bottom + 4,
        bottom: showAbove ? window.innerHeight - rect.top + 4 : undefined,
      });
    };

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [open]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocumentClick);
    return () => document.removeEventListener('mousedown', onDocumentClick);
  }, []);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, []);

  useEffect(() => {
    if (disabled && open) {
      setOpen(false);
    }
  }, [disabled, open]);

  const dropdown = (
    <div
      ref={menuRef}
      id={listboxId}
      role="listbox"
      style={menuStyle}
      className={cn(
        'mt-1 max-h-60 overflow-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-lg',
        menuClassName,
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            role="option"
            aria-selected={isSelected}
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
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-disabled={disabled}
        disabled={disabled}
        className={cn(
          'h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 pr-10 text-left text-sm text-neutral-700 outline-none transition focus:border-[#7B00D4] focus:ring-1 focus:ring-[#7B00D4]',
          disabled && 'cursor-not-allowed bg-[#F6F6F6] text-neutral-400 focus:border-neutral-200 focus:ring-0',
          className,
        )}
      >
        <span className={cn(!selectedOption && 'text-neutral-400')}>
          {selectedOption?.label ?? placeholder ?? ''}
        </span>
        <ChevronDown
          className={cn(
            'pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black',
            disabled && 'text-neutral-400',
          )}
        />
      </button>

      {open && mounted ? createPortal(dropdown, document.body) : null}
    </div>
  );
}
