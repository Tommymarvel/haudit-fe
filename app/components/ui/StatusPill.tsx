// components/ui/StatusPill.tsx
import { cn } from '@/lib/cn';

const STATUS_STYLES: Record<string, string> = {
  Repaid: 'bg-emerald-50 text-emerald-700',
  Paid: 'bg-violet-50 text-violet-700',
  Approved: 'bg-emerald-50 text-emerald-700',
  Outstanding: 'bg-amber-50 text-amber-700',
  Pending: 'bg-amber-50 text-amber-700',
  Rejected: 'bg-red-50 text-red-700',
  'Awaiting Artist': 'bg-blue-50 text-blue-700',
  'Awaiting Approval': 'bg-amber-50 text-amber-700',
};

export function StatusPill({ label }: { label: string }) {
  const cls = STATUS_STYLES[label] ?? 'bg-gray-50 text-gray-600';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium',
        cls,
      )}
    >
      <span className="h-2 w-2 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
