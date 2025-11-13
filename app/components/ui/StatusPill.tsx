// components/ui/StatusPill.tsx
import { cn } from '@/lib/cn';
export function StatusPill({
  label,
}: {
  label: 'Repaid' | 'Outstanding' | 'Pending';
}) {
  const map = {
    Repaid: 'bg-emerald-50 text-emerald-700',
    Outstanding: 'bg-amber-50 text-amber-700',
    Pending: 'bg-neutral-100 text-neutral-700',
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
