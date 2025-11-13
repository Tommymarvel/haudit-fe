import { cn } from '@/lib/cn';
type Variant = 'primary' | 'neutral' | 'outline' | 'ghost' | 'greyy';
export function Button({
  className,
  variant = 'neutral',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition';
  const styles = {
    primary: 'bg-[#7B00D4] text-white hover:bg-violet-700',
    neutral: 'bg-neutral-900 text-white hover:bg-black',
    outline: 'border border-neutral-300 bg-white hover:bg-neutral-50',
    greyy: 'bg-[#5A5A5A] text-white hover:bg-[#E5E5E5]',
    ghost: 'hover:bg-neutral-100',
  }[variant];
  return <button className={cn(base, styles, className)} {...props} />;
}
