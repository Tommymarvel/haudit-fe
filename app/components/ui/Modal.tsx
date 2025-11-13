'use client';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type ModalProps = {
  open: boolean;
  onClose: () => void;

  /** built-in header: 'bar' | 'none' */
  headerVariant?: 'bar' | 'none';

  /** optional title text for the 'bar' variant */
  title?: string;

  /** close button style: 'inline' (inside header) | 'island' (floating outside) | 'none' */
  closeVariant?: 'inline' | 'island' | 'none';

  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
};

const SIZES: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

export default function Modal({
  open,
  onClose,
  headerVariant = 'bar',
  title,
  closeVariant = 'inline',
  size = 'xl',
  children,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // lock scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const node = (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true">
      {/* backdrop */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={(e) => e.target === overlayRef.current && onClose()}
      />

      {/* panel */}
      <div className="absolute inset-0 grid place-items-center p-4">
        {/* Outside "island" close */}
        {closeVariant === 'island' && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="
                     grid h-9 w-9 place-items-center rounded-full bg-white
                     shadow-lg ring-1 ring-black/10 hover:shadow-xl z-10"
          >
            <X className="h-4 w-4 text-rose-500" />
          </button>
        )}
        <div
          ref={panelRef}
          className={`relative w-full ${SIZES[size]} overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5`}
        >
          {headerVariant === 'bar' && (
            <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50/70 px-4 py-3">
              <p className="text-sm font-medium text-neutral-700">{title}</p>
              {closeVariant === 'inline' && (
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="rounded-full p-1.5 hover:bg-neutral-200"
                >
                  <X className="h-4 w-4 text-neutral-600" />
                </button>
              )}
            </div>
          )}

          <div className="">{children}</div>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
