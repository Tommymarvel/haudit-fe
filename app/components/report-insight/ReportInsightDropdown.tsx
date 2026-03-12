'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

const OPTIONS = [
    { label: 'Track streams per DSP', path: '/royalty/track-streams-per-dsp' },
    { label: 'Track revenue per DSP', path: '/royalty/track-rev-per-dsp' },
    { label: 'Streams per track', path: '/royalty/stream-per-track?view=streams' },
    { label: 'Revenue per Track', path: '/royalty/stream-per-track?view=revenue' },
    { label: 'Streams per DSP', path: '/royalty/stream-per-dsp?view=streams' },
    { label: 'Revenue per DSP', path: '/royalty/stream-per-dsp?view=revenue' },
    { label: 'Streams and revenue per Territory', path: '/royalty/streams-and-revenue-per-territory' },
];

export function ReportInsightDropdown({ currentLabel }: { currentLabel: string }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    return (
        <div className="relative inline-block" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 text-2xl font-semibold text-[#3C3C3C] hover:opacity-80 transition-opacity"
            >
                <span>{currentLabel}</span>
                <ChevronDown className={cn("h-6 w-6 text-[#3C3C3C] transition-transform", open && "rotate-180")} />
            </button>

            {open && (
                <div className="absolute left-0 top-full mt-2 w-80 rounded-xl border border-neutral-200 bg-white shadow-xl z-50 py-2">
                    {OPTIONS.map((opt) => (
                        <button
                            key={opt.label}
                            onClick={() => {
                                setOpen(false);
                                router.push(opt.path);
                            }}
                            className={cn(
                                "w-full text-left px-5 py-3 text-[15px] transition-colors",
                                currentLabel === opt.label
                                    ? "bg-neutral-50 text-[#7B00D4] font-medium"
                                    : "text-[#5A5A5A] hover:bg-neutral-50"
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
