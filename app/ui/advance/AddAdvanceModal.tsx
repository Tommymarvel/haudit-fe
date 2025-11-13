'use client';
import Modal from '@/components/ui/Modal';
import FileDropzone from '@/components/ui/FIleDropzone';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Image from 'next/image';

const BRAND_PURPLE = '#7B00D4';

const Schema = Yup.object({
  amount: Yup.number()
    .typeError('Enter a valid amount')
    .min(1, 'Must be at least 1')
    .required('Amount is required'),
  sourceName: Yup.string().required('Source name is required'),
  phone: Yup.string().min(7, 'Too short').required('Phone is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  purpose: Yup.string().max(800, 'Too long'),
  proofs: Yup.array().of(Yup.mixed<File>()).optional(),
});

export type NewAdvancePayload = {
  amount: number;
  sourceName: string;
  phone: string;
  email: string;
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
            purpose: '',
            proofs: [] as File[],
          }}
          validationSchema={Schema}
          onSubmit={async (vals, { setSubmitting }) => {
            try {
              await onSubmit({
                amount: Number(vals.amount),
                sourceName: vals.sourceName.trim(),
                phone: vals.phone.trim(),
                email: vals.email.trim(),
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
              <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto">
                {/* Amount */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-neutral-700">
                    Amount
                  </label>
                  <Field
                    name="amount"
                    inputMode="decimal"
                    placeholder="Enter request amount"
                    className="w-full rounded-2xl border border-neutral-300 bg-white px-3 py-3 text-sm outline-none
                           focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                  />
                  <ErrorMessage
                    name="amount"
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
                {/* Purpose */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-neutral-700">
                    Advance type
                  </label>
                  <Field
                    as="select"
                    rows={4}
                    name="purpose"
                    placeholder="Tell us briefly why you’re requesting this advance"
                    className="w-full rounded-2xl border border-neutral-300 bg-white px-3 py-3 text-sm outline-none
                           focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                  />
                  <ErrorMessage
                    name="purpose"
                    component="p"
                    className="mt-1 text-xs text-rose-600"
                  />
                </div>
                {/* {status} */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-neutral-700">
                    Repayment status
                  </label>
                  <Field
                    as="select"
                    name="repaymentStatus"
                    placeholder="Tell us briefly why you’re requesting this advance"
                    className="w-full rounded-2xl border border-neutral-300 bg-white px-3 py-3 text-sm outline-none
                           focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                  />
                  <ErrorMessage
                    name="repaymentStatus"
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
                </div>{' '}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors
                         disabled:opacity-60"
                style={{ backgroundColor: BRAND_PURPLE }}
              >
                Submit request
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </Modal>
  );
}
