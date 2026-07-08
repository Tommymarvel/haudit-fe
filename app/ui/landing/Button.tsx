import Link from 'next/link';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'outline';

export function LandingButton({
  href,
  variant = 'primary',
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  const base =
    'inline-flex h-[60px] items-center justify-center rounded-2xl px-6 py-3 text-base transition';
  const styles = {
    primary: 'border border-[#451e5f] bg-[#451e5f] text-white hover:bg-[#33174a]',
    outline: 'border border-[#451e5f] text-[#451e5f] hover:bg-[#451e5f]/5',
  }[variant];

  return (
    <Link href={href} className={cn(base, styles, className)}>
      {children}
    </Link>
  );
}
