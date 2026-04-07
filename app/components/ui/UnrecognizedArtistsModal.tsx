'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
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
    const [masterArtistId, setMasterArtistId] = useState('');

    useEffect(() => {
        const initial: Record<string, { checked: boolean; artistId: string }> = {};
        unrecognizedNames.forEach((name) => {
            initial[name] = { checked: false, artistId: '' };
        });
        setSelections(initial);
        setMasterArtistId('');
    }, [unrecognizedNames, isOpen]);

    const toggleCheck = (name: string) => {
        setSelections((prev) => ({
            ...prev,
            [name]: {
                ...prev[name],
                checked: !prev[name]?.checked,
            },
        }));
    };

    const handleSelectArtist = (name: string, artistId: string) => {
        setSelections((prev) => ({
            ...prev,
            [name]: {
                ...prev[name],
                artistId,
            },
        }));
    };

    const clearAssignedArtist = (name: string) => {
        setSelections((prev) => ({
            ...prev,
            [name]: {
                checked: false,
                artistId: '',
            },
        }));
    };

    const checkedNames = useMemo(
        () =>
            Object.entries(selections)
                .filter(([, selection]) => selection?.checked)
                .map(([name]) => name),
        [selections]
    );

    const hasCheckedNames = checkedNames.length > 0;

    const hasMappings = useMemo(
        () => Object.values(selections).some((selection) => Boolean(selection?.artistId)),
        [selections]
    );

    const bulkAssignCheckedNames = () => {
        if (!masterArtistId) return;
        setSelections((prev) => {
            const next = { ...prev };
            checkedNames.forEach((name) => {
                next[name] = {
                    checked: true,
                    artistId: masterArtistId,
                };
            });
            return next;
        });
        setMasterArtistId('');
    };

    const handleFinish = async () => {
        if (!hasMappings) return;
        setIsSubmitting(true);
        try {
            const mappings: Record<string, string> = {};
            Object.entries(selections).forEach(([name, data]) => {
                if (data.artistId) {
                    mappings[name] = data.artistId;
                }
            });
            if (Object.keys(mappings).length === 0) return;
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
            <div className="px-6 py-7 sm:px-8">
                <div className="mb-6">
                    <h2 className="text-2xl font-medium text-neutral-900 mb-1">
                        Unrecognized Artists Name
                    </h2>
                    <p className="text-sm text-neutral-500">
                        List of names detected in the file but not configured.
                    </p>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-[#FBF5E4] px-4 py-3 mb-6">
                    <AlertCircle className="h-5 w-5 text-[#DDB233] shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-[#DDB233] leading-snug">
                        Only assign data to an artist whose name belongs to your label and was
                        not registered during onboarding, or if the name is misspelled.
                    </p>
                </div>

                <div className="max-h-[320px] overflow-y-auto pr-1 space-y-3 mb-5 custom-scrollbar">
                    {unrecognizedNames.map((name) => {
                        const isChecked = selections[name]?.checked || false;
                        const currentArtistId = selections[name]?.artistId || '';

                        return (
                            <div
                                key={name}
                                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_24px] items-center gap-2"
                            >
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggleCheck(name)}
                                        className="h-4 w-4 rounded border-neutral-300 text-[#7B00D4] focus:ring-[#7B00D4]"
                                    />
                                    <span className="text-[15px] leading-5 text-[#3C3C3C] whitespace-normal break-words">{name}</span>
                                </div>

                                <div>
                                    <Select
                                        value={currentArtistId}
                                        onChange={(value) => handleSelectArtist(name, value)}
                                        className="w-full rounded-xl border-neutral-300 bg-white text-sm disabled:bg-[#F7F7F7]"
                                        placeholder="Select artist to assign data to"
                                        options={systemArtists.map((artist) => ({
                                            label: artist.name,
                                            value: artist.id,
                                        }))}
                                    />
                                </div>

                                <div className="flex justify-center">
                                    {isChecked && currentArtistId ? (
                                        <button
                                            type="button"
                                            onClick={() => clearAssignedArtist(name)}
                                            className="rounded p-1 text-[#E84A4A] hover:bg-[#FDEDED]"
                                            aria-label={`Clear mapping for ${name}`}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="pt-4 border-t border-neutral-200 space-y-4">
                    <div className="space-y-2">
                        <p className="text-sm text-[#4A4A4A]">
                            Choose artist all selected name will be assigned to
                        </p>
                        <Select
                            value={masterArtistId}
                            onChange={setMasterArtistId}
                            disabled={!hasCheckedNames}
                            className="w-full rounded-xl border-neutral-300 bg-white text-sm"
                            placeholder="Select artist to assign data to"
                            options={systemArtists.map((artist) => ({
                                label: artist.name,
                                value: artist.id,
                            }))}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-2xl border-[1.5px] border-[#7B00D4] text-[#7B00D4] hover:bg-[#7B00D4]/5 py-2.5"
                            onClick={() => {
                                if (hasCheckedNames) {
                                    bulkAssignCheckedNames();
                                    return;
                                }
                                if (onIgnore) {
                                    onIgnore();
                                    return;
                                }
                                onClose();
                            }}
                            disabled={hasCheckedNames && !masterArtistId}
                        >
                            {hasCheckedNames ? 'Assign new artist' : 'Cancel'}
                        </Button>
                        <Button
                            variant="primary"
                            className="flex-1 rounded-2xl bg-[#7B00D4] hover:bg-[#6A00B8] text-white py-2.5 flex justify-center items-center"
                            onClick={handleFinish}
                            disabled={isSubmitting || !hasMappings}
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
