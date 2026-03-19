'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Modal from './Modal';
import { Button } from './Button';
import { Select } from './Select';

interface UnrecognizedArtistsModalProps {
    isOpen: boolean;
    onClose: () => void;
    unrecognizedNames: string[];
    systemArtists: { id: string; name: string }[];
    onFinish: (mappings: Record<string, string>) => Promise<void>;
    onIgnore?: () => void;
}

export default function UnrecognizedArtistsModal({
    isOpen,
    onClose,
    unrecognizedNames,
    systemArtists,
    onFinish,
    onIgnore,
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

    useEffect(() => {
        const initial: Record<string, { checked: boolean; artistId: string }> = {};
        unrecognizedNames.forEach((name) => {
            initial[name] = { checked: false, artistId: '' };
        });
        setSelections(initial);
    }, [unrecognizedNames, isOpen]);

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
            maxWidthClassName="max-w-[600px]"
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
                                    <Select
                                        value={currentArtistId}
                                        onChange={(value) => handleSelectArtist(name, value)}
                                        className="w-full rounded-2xl border-neutral-300 bg-transparent"
                                        placeholder="Select artist to assign data to"
                                        options={systemArtists.map((artist) => ({
                                            label: artist.name,
                                            value: artist.id,
                                        }))}
                                    />
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
                        <Select
                            value={masterArtistId}
                            onChange={(value) => {
                                setMasterArtistId(value);
                                if (value) {
                                    setSelections((prev) => {
                                        const next = { ...prev };
                                        Object.keys(next).forEach((n) => {
                                            if (next[n].checked) {
                                                next[n].artistId = value;
                                            }
                                        });
                                        return next;
                                    });
                                    setMasterArtistId('');
                                }
                            }}
                            className="w-full rounded-2xl border-neutral-300 bg-transparent"
                            placeholder="Select artist to assign data to"
                            options={systemArtists.map((artist) => ({
                                label: artist.name,
                                value: artist.id,
                            }))}
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-2xl border-[1.5px] border-[#7B00D4] text-[#7B00D4] hover:bg-[#7B00D4]/5 py-2.5"
                            onClick={onIgnore}
                        >
                            Ignore for now
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
