'use client';

import Modal from './Modal';
import { Button } from './Button';

interface IgnoreUnrecognizedConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export default function IgnoreUnrecognizedConfirmModal({
  open,
  onClose,
  onConfirm,
  isSubmitting = false,
}: IgnoreUnrecognizedConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} size="md" headerVariant="none" closeVariant="island">
      <div className="px-6 py-7">
        <h2 className="text-xl font-semibold text-neutral-900">Ignore unrecognized names?</h2>
        <p className="mt-2 text-sm text-neutral-600">
          You can skip this for now, but adding these names to an artist expires after 48 hours.
          You can still resolve pending names from Notifications under the File Upload tab.
        </p>

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 justify-center rounded-xl border-neutral-300"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1 justify-center rounded-xl bg-[#7B00D4] hover:bg-[#6A00B8]"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Please wait...' : 'Ignore for now'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
