'use client';
import { useEffect, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';

export default function AdvanceRowActions({
  onRepay,
  onViewDetails,
}: {
  onRepay: () => void;
  onViewDetails: () => void;
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
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg p-2 hover:bg-neutral-100"
        aria-label="Row actions"
      >
        <MoreVertical className="h-5 w-5 text-neutral-500" />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-50 w-56 rounded-xl bg-neutral-900 p-2 text-white shadow-xl">
          <button
            onClick={() => {
              setOpen(false);
              onRepay();
            }}
            className="w-full rounded-lg px-3 py-2 text-sm hover:bg-neutral-800"
          >
            Repay advance
          </button>

          <div className="my-1 h-px w-full bg-neutral-700/60" />

          <button
            onClick={() => {
              setOpen(false);
              onViewDetails();
            }}
            className="w-full rounded-lg px-3 py-2 text-sm hover:bg-neutral-800"
          >
            View advance details
          </button>
        </div>
      )}
    </div>
  );
}
