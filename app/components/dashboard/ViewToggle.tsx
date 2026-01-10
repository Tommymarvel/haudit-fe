'use client';

import { motion } from 'framer-motion';

type ViewMode = 'streams' | 'revenue';

interface ViewToggleProps {
    view: ViewMode;
    onChange: (view: ViewMode) => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
    return (
        <div className="relative flex items-center rounded-full bg-[#F4F4F4] p-1 w-fit">
            {/* Sliding background */}
            <motion.div
                className="absolute h-[calc(100%-8px)] rounded-full bg-white shadow-sm"
                layoutId="toggle-pill"
                initial={false}
                animate={{
                    x: view === 'streams' ? 0 : '100%',
                    width: '50%',
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{
                    left: 4,
                    top: 4,
                }}
            />

            <button
                onClick={() => onChange('streams')}
                className={`relative z-10 px-4 py-1.5 text-xs font-medium transition-colors ${view === 'streams' ? 'text-black' : 'text-neutral-500'
                    }`}
            >
                Streams
            </button>
            <button
                onClick={() => onChange('revenue')}
                className={`relative z-10 px-4 py-1.5 text-xs font-medium transition-colors ${view === 'revenue' ? 'text-black' : 'text-neutral-500'
                    }`}
            >
                Revenue
            </button>
        </div>
    );
}
