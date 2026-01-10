'use client';
import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/cn';

export function Menu({
  trigger,
  items,
  align = 'right',
}: {
  trigger: React.ReactNode;
  items: { label: string; onClick: () => void }[];
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) =>
      !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  return (
    <div ref={ref} className="relative ">
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-2 w-64 rounded-xl bg-neutral-900 text-white p-3 shadow-xl',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          <p className="px-2 pb-2 text-xs text-neutral-400">Quick action</p>
          <ul className="space-y-1">
            {items.map((it, i) => (
              <li key={i}>
                <button
                  className="w-full text-left rounded-lg px-2 py-2 hover:bg-neutral-800"
                  onClick={() => {
                    it.onClick();
                    setOpen(false);
                  }}
                >
                  {it.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
