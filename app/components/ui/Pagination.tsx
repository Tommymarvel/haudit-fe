'use client';
import React from 'react';

function getTokens(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 1) return [1];
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const tokens: Array<number | 'ellipsis'> = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) tokens.push('ellipsis');
  for (let p = left; p <= right; p++) tokens.push(p);
  if (right < total - 1) tokens.push('ellipsis');
  tokens.push(total);
  return tokens;
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const tokens = getTokens(page, totalPages);
  return (
    <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 text-xs text-[#8A8A8A]">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 rounded-md border border-[#DFDFDF] bg-white px-3 py-1.5 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        &lt; Previous
      </button>
      <div className="flex items-center gap-3">
        {tokens.map((token, i) =>
          token === 'ellipsis' ? (
            <span key={`e-${i}`}>…</span>
          ) : (
            <button
              type="button"
              key={token}
              onClick={() => onChange(token)}
              className={`min-w-[24px] rounded px-2 py-0.5 ${
                token === page ? 'bg-[#F0F0F0] text-[#6A6A6A]' : 'hover:bg-neutral-100'
              }`}
            >
              {token}
            </button>
          )
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-1 rounded-md border border-[#DFDFDF] bg-white px-3 py-1.5 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next &gt;
      </button>
    </div>
  );
}
