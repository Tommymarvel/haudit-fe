'use client';

import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Modal from './Modal';
import { Button } from './Button';

interface UnrecognizedArtist {
    originalName: string;
    selectedArtistId?: string;
}

interface UnrecognizedArtistsModalProps {
    isOpen: boolean;
    onClose: () => void;
    unrecognizedNames: string[];
    systemArtists: { id: string; name: string }[];
    onFinish: (mappings: Record<string, string>) => Promise<void>;
    onAssignNewArtist?: () => void;
}

export default function UnrecognizedArtistsModal({
    isOpen,
    onClose,
    unrecognizedNames,
    systemArtists,
    onFinish,
    onAssignNewArtist,
}: UnrecognizedArtistsModalProps) {
    // Local state to keep track of checked status and selected mapping for each unrecognized name
    const [selections, setSelections] = useState<
        Record<string, { checked: boolean; artistId: string }>
    >(() => {
        const initial: Record<string, { checked: boolean; artistId: string }> = {};
        unrecognizedNames.forEach((name) => {
            initial[name] = { checked: false, artistId: '' };
        });
        return initial;
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle individual checkbox toggle
    const toggleCheck = (name: string) => {
        setSelections((prev) => ({
            ...prev,
            [name]: {
                ...prev[name],
                checked: !prev[name].checked,
            },
        }));
    };

    // Handle dropdown selection change
    const handleSelectArtist = (name: string, artistId: string) => {
        setSelections((prev) => ({
            ...prev,
            [name]: {
                ...prev[name],
                artistId,
            },
        }));
    };

    // Master dropdown (bottom left) - applies chosen artist to ALL CHECKED names
    const [masterArtistId, setMasterArtistId] = useState('');

    const handleApplyMasterArtist = () => {
        if (!masterArtistId) return;

        setSelections((prev) => {
            const next = { ...prev };
            Object.keys(next).forEach((name) => {
                if (next[name].checked) {
                    next[name].artistId = masterArtistId;
                }
            });
            return next;
        });
        setMasterArtistId(''); // Reset after applying
    };

    const handleFinish = async () => {
        setIsSubmitting(true);
        try {
            const mappings: Record<string, string> = {};
            Object.entries(selections).forEach(([name, data]) => {
                if (data.artistId) {
                    mappings[name] = data.artistId;
                }
            });
            await onFinish(mappings);
        } catch (error) {
            console.error('Failed to map artists:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            size="lg" // 3xl or lg depending on original Modal.tsx sizes. lg is max-w-3xl there.
            headerVariant="none"
            closeVariant="island"
        >
            <div className="px-8 py-8">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-medium text-neutral-900 mb-1">
                        Unrecognized Artists Name
                    </h2>
                    <p className="text-sm text-neutral-500">
                        List of names detected in the file but not configured.
                    </p>
                </div>

                {/* Warning Banner */}
                <div className="flex items-start gap-3 rounded-2xl bg-[#FBF5E4] px-4 py-3 mb-6">
                    <AlertCircle className="h-5 w-5 text-[#DDB233] shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-[#DDB233] leading-snug">
                        Only assign data to an artist whose name belongs to your label and was
                        not registered during onboarding, or if the name is misspelled.
                    </p>
                </div>

                {/* List of Unrecognized Names */}
                <div className="max-h-[360px] overflow-y-auto pr-2 space-y-4 mb-6 custom-scrollbar">
                    {unrecognizedNames.map((name) => {
                        const isChecked = selections[name]?.checked || false;
                        const currentArtistId = selections[name]?.artistId || '';

                        return (
                            <div key={name} className="flex items-center justify-between">
                                {/* Checkbox and Name */}
                                <div
                                    className="flex items-center gap-3 w-1/3 cursor-pointer"
                                    onClick={() => toggleCheck(name)}
                                >
                                    <div
                                        className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${isChecked
                                                ? 'border-[#7B00D4] bg-[#7B00D4]'
                                                : 'border-neutral-300 bg-white'
                                            }`}
                                    >
                                        {isChecked && (
                                            <svg
                                                className="h-3.5 w-3.5 text-white"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={3}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="text-base text-neutral-800">{name}</span>
                                </div>

                                {/* Individual Dropdown */}
                                <div className="w-2/3 pl-4">
                                    <div className="relative">
                                        <select
                                            value={currentArtistId}
                                            onChange={(e) => handleSelectArtist(name, e.target.value)}
                                            className="w-full appearance-none rounded-2xl border border-neutral-300 bg-transparent px-4 py-2 text-sm text-neutral-700 outline-none focus:border-[#7B00D4] focus:ring-1 focus:ring-[#7B00D4]"
                                        >
                                            <option value="" disabled className="text-neutral-400">
                                                Select artist to assign data to
                                            </option>
                                            {systemArtists.map((artist) => (
                                                <option key={artist.id} value={artist.id}>
                                                    {artist.name}
                                                </option>
                                            ))}
                                        </select>
                                        {/* Select Arrow Icon */}
                                        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                                            <svg
                                                className="h-4 w-4 text-neutral-500"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-neutral-100 flex flex-col gap-6">
                    {/* Master Selector */}
                    <div className="flex flex-col gap-3">
                        <span className="text-base text-neutral-800">
                            Choose artist all selected name will be assigned to
                        </span>
                        <div className="relative">
                            <select
                                value={masterArtistId}
                                onChange={(e) => {
                                    setMasterArtistId(e.target.value);
                                    // Optionally auto-apply when selected, or wait for another action
                                    // For now, let's auto-apply if we assume that's the UX
                                    if (e.target.value) {
                                        setSelections((prev) => {
                                            const next = { ...prev };
                                            Object.keys(next).forEach((n) => {
                                                if (next[n].checked) {
                                                    next[n].artistId = e.target.value;
                                                }
                                            });
                                            return next;
                                        });
                                        setMasterArtistId(''); // reset dropdown after applying
                                    }
                                }}
                                className="w-full appearance-none rounded-2xl border border-neutral-300 bg-transparent px-4 py-2 text-sm text-neutral-700 outline-none focus:border-[#7B00D4] focus:ring-1 focus:ring-[#7B00D4]"
                            >
                                <option value="" disabled className="text-neutral-400">
                                    Select artist to assign data to
                                </option>
                                {systemArtists.map((artist) => (
                                    <option key={artist.id} value={artist.id}>
                                        {artist.name}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                                <svg
                                    className="h-4 w-4 text-neutral-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-2xl border-[1.5px] border-[#7B00D4] text-[#7B00D4] hover:bg-[#7B00D4]/5 py-2.5"
                            onClick={onAssignNewArtist}
                        >
                            Assign new artist
                        </Button>
                        <Button
                            variant="primary"
                            className="flex-1 rounded-2xl bg-[#7B00D4] hover:bg-[#6A00B8] text-white py-2.5 flex justify-center items-center"
                            onClick={handleFinish}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                            ) : (
                                'Finish'
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
