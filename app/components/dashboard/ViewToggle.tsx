'use client';

type ViewMode = 'streams' | 'revenue';

interface ViewToggleProps {
    view: ViewMode;
    onChange: (view: ViewMode) => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
    return (
        <div className="relative flex items-center rounded-full bg-[#F4F4F4] p-1 w-fit">
            {/* Sliding background */}
            <span
                className={`absolute left-1 top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
                    view === 'revenue' ? 'translate-x-full' : 'translate-x-0'
                }`}
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
