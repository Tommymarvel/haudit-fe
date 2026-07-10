'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useAdvance } from '@/hooks/useAdvance';
import { useAuth } from '@/contexts/AuthContext';
import { formatAmountInput, parseAmountInput } from '@/lib/utils/currency';

type RequestFormState = {
  date: string;
  amount: string;
  currency: 'USD' | 'NGN';
  advanceType: 'personal' | 'marketting';
  purpose: string;
};

const ADVANCE_TYPE_OPTIONS = [
  { label: 'Personal', value: 'personal' },
  { label: 'Marketing', value: 'marketting' },
];

const CURRENCY_OPTIONS = [
  { label: 'NGN', value: 'NGN' },
  { label: 'USD', value: 'USD' },
];

const INPUT_CLASS =
  'h-10 w-full rounded-xl border border-[#B9B9B9] bg-white px-3 text-sm text-[#3C3C3C] outline-none placeholder:text-[#B0B0B0]';

function buildInitialRequestForm(): RequestFormState {
  return { date: '', amount: '', currency: 'NGN', advanceType: 'personal', purpose: '' };
}

/**
 * Advance request form for label artists (Date / Category / Amount / Purpose).
 * Shared between the Advance-O-Meter page and the label-artist dashboard so the
 * dashboard no longer surfaces the solo/indie advance form.
 */
export default function LabelAdvanceRequestModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { createAdvance } = useAdvance();
  const [form, setForm] = useState<RequestFormState>(() => buildInitialRequestForm());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();

  const handleClose = () => {
    setForm(buildInitialRequestForm());
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = parseAmountInput(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!form.purpose.trim()) {
      toast.error('Purpose is required');
      return;
    }
    try {
      setIsSubmitting(true);
      await createAdvance({
        amount,
        currency: form.currency,
        advance_source_name: displayName || 'Label Artist',
        advance_source_phn: 'N/A',
        advance_source_email: user?.email || 'labelartist@haudit.dev',
        advance_type: form.advanceType,
        repayment_status: 'outstanding',
        purpose: form.purpose.trim(),
      });
      toast.success('Advance request submitted successfully');
      setForm(buildInitialRequestForm());
      onClose();
    } catch (error) {
      console.error('Failed to submit advance request', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} headerVariant="none" closeVariant="island" size="md">
      <div className="px-6 py-6 sm:px-8">
        <div className="flex flex-col items-center text-center">
          <Image src="/haudit-logo.svg" alt="Haudit" width={40} height={40} />
          <p className="mt-2 text-[24px] font-semibold text-[#2D2D2D]">Advance Request Form</p>
          <p className="mt-1 text-xs text-[#959595]">
            Explain why you need an increase to your eligible advance.
          </p>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {/* Date */}
          <div>
            <label className="text-xs font-medium text-[#2D2D2D]">Date</label>
            <div className="relative mt-1">
              <input
                type="date"
                className={INPUT_CLASS + ' pr-9'}
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              />
              <Calendar className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#B0B0B0]" />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-medium text-[#2D2D2D]">Category</label>
            <div className="mt-1">
              <Select
                value={form.advanceType}
                onChange={(v) => setForm((p) => ({ ...p, advanceType: v as RequestFormState['advanceType'] }))}
                options={ADVANCE_TYPE_OPTIONS}
                placeholder="Select a category"
                className="h-10 rounded-xl border border-[#B9B9B9] bg-white text-sm"
              />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-medium text-[#2D2D2D]">Amount</label>
            <div className="mt-1 flex overflow-hidden rounded-xl border border-[#B9B9B9] bg-white">
              <Select
                value={form.currency}
                onChange={(v) => setForm((p) => ({ ...p, currency: v as RequestFormState['currency'] }))}
                options={CURRENCY_OPTIONS}
                className="h-10 w-20 shrink-0 rounded-none border-0 border-r border-[#B9B9B9] bg-neutral-50 text-xs"
              />
              <input
                type="text"
                inputMode="decimal"
                placeholder="Enter amount"
                className="min-w-0 flex-1 bg-transparent px-3 text-sm text-[#3C3C3C] outline-none placeholder:text-[#B0B0B0]"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: formatAmountInput(e.target.value) }))}
              />
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="text-xs font-medium text-[#2D2D2D]">Purpose</label>
            <textarea
              rows={4}
              placeholder="Enter expenses description"
              className="mt-1 w-full resize-none rounded-xl border border-[#B9B9B9] bg-white px-3 py-2 text-sm text-[#3C3C3C] outline-none placeholder:text-[#B0B0B0]"
              value={form.purpose}
              onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full rounded-xl bg-[#7B00D4] text-sm font-medium text-white disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </Modal>
  );
}
