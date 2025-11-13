'use client';
import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type ClipboardEvent,
} from 'react';

export default function OTPInput({
  length = 4,
  value,
  onChange,
}: {
  length?: number;
  value: string;
  onChange: (v: string) => void;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    refs.current = refs.current.slice(0, length);
  }, [length]);

  const setChar = (i: number, ch: string) => {
    const next = value.split('');
    next[i] = ch;
    onChange(next.join('').slice(0, length));
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>, i: number) => {
    const k = e.key;
    if (k === 'Backspace') {
      e.preventDefault();
      // If current cell is empty, clear previous and move focus back
      if (!value[i]) {
        if (i > 0) {
          setChar(i - 1, '');
          refs.current[i - 1]?.focus();
        }
        return;
      }
      // Otherwise clear current cell
      setChar(i, '');
      return;
    }
    if (/^[0-9]$/.test(k)) {
      e.preventDefault();
      setChar(i, k);
      if (i < length - 1) refs.current[i + 1]?.focus();
    }
    if (k === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (k === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const txt = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, length);
    if (txt) onChange(txt);
    e.preventDefault();
    refs.current[Math.min(txt.length, length) - 1 || 0]?.focus();
  };

  return (
    <div
      className="flex items-center gap-2"
      role="group"
      aria-label="Verification code"
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={() => {}}
          onKeyDown={(e) => handleKey(e, i)}
          onPaste={handlePaste}
          className="h-11 w-11 rounded-lg border border-neutral-300 text-center text-base text-black outline-none focus:ring-2 focus:ring-neutral-200"
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
