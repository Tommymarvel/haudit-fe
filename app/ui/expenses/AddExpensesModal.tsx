'use client';
import Modal from '@/components/ui/Modal';
import FileDropzone from '@/components/ui/FIleDropzone';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Image from 'next/image';

const BRAND_PURPLE = '#7B00D4';

const Categories = ['Marketing', 'Production', 'Operations', 'Legal'] as const;
type Category = (typeof Categories)[number];

const Schema = Yup.object({
  date: Yup.string().required('Date is required'),
  category: Yup.mixed<Category>()
    .oneOf([...Categories] as readonly Category[], 'Select a valid category')
    .required('Category is required'),
  amount: Yup.number()
    .typeError('Enter a valid amount')
    .min(1, 'Must be at least 1')
    .required('Amount is required'),
  description: Yup.string().max(800, 'Too long').optional(),
  proofs: Yup.array().of(Yup.mixed<File>()).optional(),
});

export type NewExpensesPayload = {
  date: string; // e.g. 2025-03-01 (or your preferred format)
  category: Category;
  amount: number;
  description?: string;
  proofs?: File[];
};

export default function AddExpensesModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewExpensesPayload) => Promise<void> | void;
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
        {/* Title */}
        <div className="mt-1 flex flex-col items-center text-center">
          <Image src="/haudit-logo.svg" alt="Haudit" width={48} height={48} />
          <h2 className="text-2xl font-medium text-[#1F1F1F]">Expenses Form</h2>
          <p className="mt-1 text-sm text-[#959595]">
            Fill in all necessary details to onboard new artists.
          </p>
        </div>

        <Formik
          initialValues={{
            date: '',
            category: '',
            amount: '',
            description: '',
            proofs: [] as File[],
          }}
          validationSchema={Schema}
          onSubmit={async (vals, { setSubmitting }) => {
            try {
              await onSubmit({
                date: vals.date,
                category: vals.category as Category,
                amount: Number(vals.amount),
                description: vals.description?.trim() || undefined,
                proofs: vals.proofs,
              });
              onClose();
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, setFieldValue, values }) => (
            <Form className="mx-auto mt-6 w-full max-w-xl  ">
              <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto">
                {/* Date */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-neutral-700">
                    Date
                  </label>
                  <Field
                    name="date"
                    type="date"
                    className="w-full rounded-2xl border border-neutral-300 bg-white px-3 py-3 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                  />
                  <ErrorMessage
                    name="date"
                    component="p"
                    className="mt-1 text-xs text-rose-600"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-neutral-700">
                    Category
                  </label>
                  <Field
                    as="select"
                    name="category"
                    className="w-full rounded-2xl border border-neutral-300 bg-white px-3 py-3 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                  >
                    <option value="">Select category</option>
                    {Categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name="category"
                    component="p"
                    className="mt-1 text-xs text-rose-600"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-neutral-700">
                    Amount
                  </label>
                  <Field
                    name="amount"
                    inputMode="decimal"
                    placeholder="Enter amount"
                    className="w-full rounded-2xl border border-neutral-300 bg-white px-3 py-3 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                  />
                  <ErrorMessage
                    name="amount"
                    component="p"
                    className="mt-1 text-xs text-rose-600"
                  />
                </div>

                {/* Receipts / Proofs */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-neutral-700">
                    Upload receipt
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

                {/* Description */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-neutral-700">
                    Description
                  </label>
                  <Field
                    as="textarea"
                    rows={4}
                    name="description"
                    placeholder="Enter expenses description"
                    className="w-full rounded-2xl border border-neutral-300 bg-white px-3 py-3 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                  />
                  <ErrorMessage
                    name="description"
                    component="p"
                    className="mt-1 text-xs text-rose-600"
                  />
                </div>
              </div>
              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-60"
                style={{ backgroundColor: BRAND_PURPLE }}
              >
                Save expense
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </Modal>
  );
}
