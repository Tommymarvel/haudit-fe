'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Modal from './Modal';
import { Button } from './Button';

type SoloSelection = Record<string, boolean>;

interface SoloUnrecognizedArtistsModalProps {
  isOpen: boolean;
  onClose: () => void;
  unrecognizedNames: string[];
  onFinish: (mappings: Record<string, string>) => Promise<void>;
  currentArtistId?: string;
  onIgnore?: () => void;
}

export default function SoloUnrecognizedArtistsModal({
  isOpen,
  onClose,
  unrecognizedNames,
  onFinish,
  currentArtistId,
  onIgnore,
}: SoloUnrecognizedArtistsModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selections, setSelections] = useState<SoloSelection>({});

  useEffect(() => {
    const initial: SoloSelection = {};
    unrecognizedNames.forEach((name) => {
      initial[name] = false;
    });
    setSelections(initial);
  }, [unrecognizedNames, isOpen]);

  const handleToggle = (name: string) => {
    setSelections((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleFinish = async () => {
    if (!currentArtistId) return;
    setIsSubmitting(true);
    try {
      const mappings: Record<string, string> = {};
      Object.entries(selections).forEach(([name, checked]) => {
        if (checked) {
          mappings[name] = currentArtistId;
        }
      });
      await onFinish(mappings);
    } catch (error) {
      console.error('Failed to map solo artist names:', error);
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
      <div className="px-8 py-8 ">
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
            Only assign data if the name belongs to you and was not registered during onboarding, or if it is a misspelling.
          </p>
        </div>

        <div className="max-h-[360px] overflow-y-auto pr-2 space-y-4 mb-6">
          {unrecognizedNames.map((name) => (
            <div key={name} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
              <span className="text-base text-neutral-800 break-words pr-2">{name}</span>
              <label className="inline-flex items-center gap-2 text-sm text-neutral-700 cursor-pointer select-none whitespace-nowrap shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={Boolean(selections[name])}
                  onChange={() => handleToggle(name)}
                  className="h-4 w-4 rounded border-neutral-300 text-[#7B00D4] focus:ring-[#7B00D4]"
                />
                Assign data to you
              </label>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-neutral-200 flex items-center gap-4">
          <Button
            variant="outline"
            className="flex-1 justify-center rounded-2xl border-[1.5px] border-[#7B00D4] text-[#7B00D4] hover:bg-[#7B00D4]/5 py-3"
            onClick={onIgnore}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1 justify-center rounded-2xl bg-[#7B00D4] hover:bg-[#6A00B8] text-white py-3"
            onClick={handleFinish}
            disabled={isSubmitting || !currentArtistId}
          >
            {isSubmitting ? 'Please wait...' : 'Finish'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
