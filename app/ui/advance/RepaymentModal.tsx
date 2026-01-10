'use client';
import Modal from '@/components/ui/Modal';
import FileDropzone from '@/components/ui/FIleDropzone';
import * as Yup from 'yup';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import Image from 'next/image';

const createSchema = (requireAdvance: boolean) => Yup.object({
  advanceId: requireAdvance 
    ? Yup.string().required('Please select an advance')
    : Yup.string(),
  amount: Yup.number().typeError('Enter a valid amount')
    .min(1, 'Must be at least 1').required('Amount is required'),
  files: Yup.array().min(1, 'Please attach at least one proof').required(),
});

export type RepaymentPayload = {
  advanceId?: string;
  amount: number;
  files: File[];
};

type AdvanceOption = {
  id: string;
  source: string;
  amount: number;
  balance: number;
};

export default function RepaymentModal({
  open, onClose, onSubmit, advances, preselectedAdvanceId,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RepaymentPayload) => Promise<void> | void;
  advances?: AdvanceOption[];
  preselectedAdvanceId?: string;
}) {
  const showAdvanceSelector = !preselectedAdvanceId && advances && advances.length > 0;
  return (
    <Modal
      open={open}
      onClose={onClose}
      headerVariant="none"
      closeVariant="island"
      size="md"
    >
      {/* Logo + Title */}
      <div className="mt-10 flex flex-col items-center text-center">
        <Image src="/haudit-logo.svg" alt="Haudit" width={48} height={48} />

        <h2 className="text-2xl font-medium text-[#1F1F1F]">
          Advance Repayment form
        </h2>
        <p className="mt-1 max-w-sm text-sm text-[#959595]">
          Let us get to know why you are requesting for Advance.
        </p>
      </div>

      <Formik
        initialValues={{ advanceId: preselectedAdvanceId || '', amount: '', files: [] as File[] }}
        validationSchema={createSchema(!!showAdvanceSelector)}
        onSubmit={async (vals, { setSubmitting }) => {
          try {
            await onSubmit({ 
              advanceId: vals.advanceId || preselectedAdvanceId,
              amount: Number(vals.amount), 
              files: vals.files 
            });
            onClose();
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting, setFieldValue, values }) => (
          <Form className="mx-10 mt-6 mb-5  space-y-5">
            {showAdvanceSelector && (
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Select Advance
                </label>
                <Field
                  as="select"
                  name="advanceId"
                  className="w-full rounded-2xl border border-neutral-300 bg-white px-3 py-3 text-sm outline-none
                             focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                >
                  <option value="">Select an advance to repay</option>
                  {advances.map((adv) => (
                    <option key={adv.id} value={adv.id}>
                      {adv.source} - ${adv.amount.toLocaleString()} (Balance: ${adv.balance.toLocaleString()})
                    </option>
                  ))}
                </Field>
                <ErrorMessage
                  name="advanceId"
                  component="p"
                  className="mt-1 text-xs text-rose-600"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
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

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Proof of payment
              </label>
              <FileDropzone
                onFiles={(files) => setFieldValue('files', files)}
                className="bg-white"
              />
              {values.files?.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-neutral-600">
                  {values.files.map((f, i) => (
                    <li key={i}>{f.name}</li>
                  ))}
                </ul>
              )}
              <ErrorMessage
                name="files"
                component="p"
                className="mt-1 text-xs text-rose-600"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-[#7B00D4] px-4 py-3 text-sm font-medium text-white
                         shadow-sm transition-colors hover:bg-[#6e00bf] disabled:opacity-60"
            >
              Submit request
            </button>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
