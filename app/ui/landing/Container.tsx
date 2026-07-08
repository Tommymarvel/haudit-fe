import { cn } from '@/lib/cn';

export function Container({
  className,
  id,
  children,
}: {
  className?: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className={cn(
        'mx-auto w-full max-w-[1440px] px-6 sm:px-10 lg:px-[90px]',
        className
      )}
    >
      {children}
    </div>
  );
}
