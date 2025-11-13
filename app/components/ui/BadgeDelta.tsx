import { ArrowDown, ArrowUp } from "lucide-react";

export function BadgeDelta({ value }: { value: number }) {
  const up = value >= 0;

  return (
    <span
      className={`inline-flex font-medium items-center gap-1  px-2 py-1 text-sm
      ${up ? ' text-emerald-700' : ' text-rose-700'}`}
    >
      {up ? <ArrowUp /> : <ArrowDown />} {Math.abs(value)}%
    </span>
  );
}
