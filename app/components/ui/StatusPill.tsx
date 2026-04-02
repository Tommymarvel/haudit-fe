// components/ui/StatusPill.tsx
import { cn } from '@/lib/cn';
export function StatusPill({
  label,
}: {
  label: 'Repaid' | 'Outstanding' | 'Pending' | 'Approved' | 'Rejected' | 'Paid';
}) {
  const map = {
    Repaid: 'bg-emerald-50 text-emerald-700',
    Paid: 'bg-violet-50 text-violet-700',
    Approved: 'bg-emerald-50 text-emerald-700',
    Outstanding: 'bg-amber-50 text-amber-700',
    Pending: 'bg-amber-50 text-amber-700',
    Rejected: 'bg-red-50 text-red-700',
  } as const;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium',
        map[label]
      )}
    >
      <span className="h-2 w-2 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
