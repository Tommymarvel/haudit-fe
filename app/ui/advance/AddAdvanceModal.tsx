'use client';
import Modal from '@/components/ui/Modal';
import FileDropzone from '@/components/ui/FIleDropzone';
import { Select } from '@/components/ui/Select';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { formatAmountInput, parseAmountInput } from '@/lib/utils/currency';

const BRAND_PURPLE = '#7B00D4';
const Currencies = ['USD', 'NGN'] as const;

const parseAmountForValidation = (originalValue: unknown) => {
  if (originalValue === undefined || originalValue === null) return undefined;
  if (typeof originalValue === 'string' && originalValue.trim() === '') return undefined;
  const parsed = parseAmountInput(originalValue);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const Schema = Yup.object({
  amount: Yup.number()
    .transform((_value, originalValue) => parseAmountForValidation(originalValue))
    .typeError('Enter a valid amount')
    .min(1, 'Must be at least 1')
    .required('Amount is required'),
  sourceName: Yup.string().required('Source name is required'),
  phone: Yup.string().min(7, 'Too short').required('Phone is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  advanceType: Yup.string()
    .oneOf(['personal', 'marketting', 'Signing advance', 'Artist Personal advance', 'Album/project advance', 'Single advance', 'Renewal/extension advance', 'Recording fund advance', 'Production advance', 'Producer advance', 'Studio advance', 'Marketing advance', 'Promotion advance', 'Digital marketing / ad-spend advance', 'PR advance', 'Music video advance', 'Content creation advance', 'Distribution advance', 'Label services advance', 'Advance against royalties', 'Royalty advance', 'Show guarantee (advance payment)', 'Performance advance', 'Tour support advance', 'Sponsorship advance', 'Brand partnership advance', 'Endorsement advance', 'Recoupable advance', 'others'], 'Select a valid advance type')
    .required('Advance type is required'),
  repaymentStatus: Yup.string()
    .oneOf(['repaid', 'outstanding'], 'Select a valid repayment status')
    .required('Repayment status is required'),
  currency: Yup.mixed<(typeof Currencies)[number]>()
    .oneOf([...Currencies] as readonly (typeof Currencies)[number][], 'Select a valid currency')
    .required('Currency is required'),
  purpose: Yup.string().max(800, 'Too long').required('Purpose is required'),
  proofs: Yup.array().of(Yup.mixed<File>()).optional(),
});

export type NewAdvancePayload = {
  amount: number;
  sourceName: string;
  phone: string;
  email: string;
  advanceType: string;
  repaymentStatus: 'repaid' | 'outstanding';
  currency: (typeof Currencies)[number];
  purpose?: string;
  proofs?: File[];
};

export default function AddAdvanceModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewAdvancePayload) => Promise<void> | void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      headerVariant="none"
      closeVariant="island"
      size="md"
    >
      <div className="m-5 lg:m-10 ">
        {/* Logo + Title */}
        <div className="mt-1 flex flex-col items-center text-center">
          <Image src="/haudit-logo.svg" alt="Haudit" width={48} height={48} />

          <h2 className="text-2xl font-medium text-[#1F1F1F]">
            Add new advance
          </h2>
          <p className="mt-1 text-sm text-[#959595]">
            Let us get to know why you are requesting for Advance.
          </p>
        </div>

        <Formik
          initialValues={{
            amount: '',
            sourceName: '',
            phone: '',
            email: '',
            currency: 'USD',
            advanceType: 'personal',
            repaymentStatus: 'outstanding',
            purpose: '',
            proofs: [] as File[],
          }}
          validationSchema={Schema}
          onSubmit={async (vals, { setSubmitting }) => {
            try {
              const parsedAmount = parseAmountInput(vals.amount);
              await onSubmit({
                amount: Number.isFinite(parsedAmount) ? parsedAmount : 0,
                sourceName: vals.sourceName.trim(),
                phone: vals.phone.trim(),
                email: vals.email.trim(),
                advanceType: vals.advanceType,
                repaymentStatus: vals.repaymentStatus as 'repaid' | 'outstanding',
                currency: vals.currency as (typeof Currencies)[number],
                purpose: vals.purpose?.trim() || undefined,
                proofs: vals.proofs,
              });
              onClose();
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, setFieldValue, values }) => (
            <Form className="mx-auto mt-6 w-full max-w-xl space-y-4">
              <div className="space-y-4">
                {/* Amount */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-neutral-700">
                    Amount
                  </label>
                  <input
                    name="amount"
                    inputMode="decimal"
                    placeholder="Enter request amount"
                    value={values.amount}
                    onChange={(event) =>
                      setFieldValue('amount', formatAmountInput(event.target.value))
                    }
                    className="w-full rounded-2xl border border-neutral-300 bg-white px-3 py-3 text-sm outline-none
                           focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                  />
                  <ErrorMessage
                    name="amount"
                    component="p"
                    className="mt-1 text-xs text-rose-600"
                  />
                </div>
                {/* Currency */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-neutral-700">
                    Currency
                  </label>
                  <Select
                    value={values.currency}
                    onChange={(val) => setFieldValue('currency', val)}
                    options={Currencies.map((c) => ({ value: c, label: c }))}
                    className="h-12 rounded-2xl"
                  />
                  <ErrorMessage
                    name="currency"
                    component="p"
                    className="mt-1 text-xs text-rose-600"
                  />
                </div>
                {/* Source name */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-neutral-700">
                    Advance source name
                  </label>
                  <Field
                    name="sourceName"
                    placeholder="Enter advance source name"
                    className="w-full rounded-2xl border border-neutral-300 bg-white px-3 py-3 text-sm outline-none
                           focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                  />
                  <ErrorMessage
                    name="sourceName"
                    component="p"
                    className="mt-1 text-xs text-rose-600"
                  />
                </div>
                {/* Phone */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-neutral-700">
                    Advance source phone number
                  </label>
                  <Field
                    name="phone"
                    inputMode="tel"
                    placeholder="Enter source phone number"
                    className="w-full rounded-2xl border border-neutral-300 bg-white px-3 py-3 text-sm outline-none
                           focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                  />
                  <ErrorMessage
                    name="phone"
                    component="p"
                    className="mt-1 text-xs text-rose-600"
                  />
                </div>
                {/* Email */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-neutral-700">
                    Advance source email address
                  </label>
                  <Field
                    name="email"
                    type="email"
                    placeholder="Enter source email address"
                    className="w-full rounded-2xl border border-neutral-300 bg-white px-3 py-3 text-sm outline-none
                           focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                  />
                  <ErrorMessage
                    name="email"
                    component="p"
                    className="mt-1 text-xs text-rose-600"
                  />
                </div>
                {/* Advance type */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-neutral-700">
                    Advance type
                  </label>
                  <Select
                    value={values.advanceType}
                    onChange={(val) => setFieldValue('advanceType', val)}
                    placeholder="Select advance type"
                    options={[
                      { value: 'personal', label: 'Personal' },
                      { value: 'marketting', label: 'Marketing' },
                      { value: 'Signing advance', label: 'Signing advance' },
                      { value: 'Artist Personal advance', label: 'Artist Personal advance' },
                      { value: 'Album/project advance', label: 'Album/project advance' },
                      { value: 'Single advance', label: 'Single advance' },
                      { value: 'Renewal/extension advance', label: 'Renewal/extension advance' },
                      { value: 'Recording fund advance', label: 'Recording fund advance' },
                      { value: 'Production advance', label: 'Production advance' },
                      { value: 'Producer advance', label: 'Producer advance' },
                      { value: 'Studio advance', label: 'Studio advance' },
                      { value: 'Marketing advance', label: 'Marketing advance' },
                      { value: 'Promotion advance', label: 'Promotion advance' },
                      { value: 'Digital marketing / ad-spend advance', label: 'Digital marketing / ad-spend advance' },
                      { value: 'PR advance', label: 'PR advance' },
                      { value: 'Music video advance', label: 'Music video advance' },
                      { value: 'Content creation advance', label: 'Content creation advance' },
                      { value: 'Distribution advance', label: 'Distribution advance' },
                      { value: 'Label services advance', label: 'Label services advance' },
                      { value: 'Advance against royalties', label: 'Advance against royalties' },
                      { value: 'Royalty advance', label: 'Royalty advance' },
                      { value: 'Show guarantee (advance payment)', label: 'Show guarantee (advance payment)' },
                      { value: 'Performance advance', label: 'Performance advance' },
                      { value: 'Tour support advance', label: 'Tour support advance' },
                      { value: 'Sponsorship advance', label: 'Sponsorship advance' },
                      { value: 'Brand partnership advance', label: 'Brand partnership advance' },
                      { value: 'Endorsement advance', label: 'Endorsement advance' },
                      { value: 'Recoupable advance', label: 'Recoupable advance' },
                      { value: 'others', label: 'Others' },
                    ]}
                  />
                  <ErrorMessage
                    name="advanceType"
                    component="p"
                    className="mt-1 text-xs text-rose-600"
                  />
                </div>
                {/* Repayment status */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-neutral-700">
                    Repayment status
                  </label>
                  <Select
                    value={values.repaymentStatus}
                    onChange={(val) => setFieldValue('repaymentStatus', val)}
                    options={[
                      { value: 'outstanding', label: 'Outstanding' },
                      { value: 'repaid', label: 'Repaid' },
                    ]}
                    className="h-12 rounded-2xl"
                  />
                  <ErrorMessage
                    name="repaymentStatus"
                    component="p"
                    className="mt-1 text-xs text-rose-600"
                  />
                </div>
                {/* Purpose */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-neutral-700">
                    Purpose
                  </label>
                  <Field
                    as="textarea"
                    rows={7}
                    name="purpose"
                    placeholder="Give a detailed purpose of the request"
                    className="w-full rounded-2xl border border-neutral-300 bg-white px-3 py-3 text-sm outline-none
                           focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                  />
                  <ErrorMessage
                    name="purpose"
                    component="p"
                    className="mt-1 text-xs text-rose-600"
                  />
                </div>
                {/* Proof of payment */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-neutral-700">
                    Proof of payment
                  </label>
                  <FileDropzone
                    onFiles={(files) => setFieldValue('proofs', files)}
                    className="bg-white"
                  />
                  {values.proofs?.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-neutral-600">
                      {values.proofs.map((f, i) => (
                        <li key={i}>{f.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
                {' '}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors
                         disabled:opacity-60"
                style={{ backgroundColor: BRAND_PURPLE }}
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  'Submit request'
                )}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </Modal>
  );
}
