'use client';
import Modal from '@/components/ui/Modal';
import FileDropzone from '@/components/ui/FIleDropzone';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Image from 'next/image';
import { ChevronDown, Loader2 } from 'lucide-react';

const BRAND_PURPLE = '#7B00D4';

const Categories = ['marketting', 'production', 'personal'] as const;
type Category = (typeof Categories)[number];

const Currencies = ['NGN', 'USD'] as const;

// Currency prefix mapping to display symbols/text
const CurrencyPrefix: Record<(typeof Currencies)[number], string> = {
  NGN: '₦',
  USD: '$',
};

// Display names for categories
const CategoryDisplay: Record<Category, string> = {
  marketting: 'Marketing',
  production: 'Production',
  personal: 'Personal',
};

const Schema = Yup.object({
  expense_date: Yup.string().required('Date is required'),
  category: Yup.mixed<Category>()
    .oneOf([...Categories] as readonly Category[], 'Select a valid category')
    .required('Category is required'),
  currency: Yup.string().required('Currency is required'),
  amount: Yup.number()
    .typeError('Enter a valid amount')
    .min(1, 'Must be at least 1')
    .required('Amount is required'),
  description: Yup.string().max(800, 'Too long').optional(),
  proofs: Yup.array().of(Yup.mixed<File>()).optional(),
});

export type NewExpensesPayload = {
  expense_date: string; // e.g. 2025-03-01 (or your preferred format)
  category: Category;
  amount: number;
  currency: string;
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
            expense_date: '',
            category: '',
            amount: '',
            currency: 'NGN',
            description: '',
            proofs: [] as File[],
          }}
          validationSchema={Schema}
          onSubmit={async (vals, { setSubmitting }) => {
            try {
              await onSubmit({
                expense_date: vals.expense_date,
                category: vals.category as Category,
                amount: Number(vals.amount),
                currency: vals.currency,
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
                    name="expense_date"
                    type="date"
                    className="w-full rounded-2xl border border-neutral-300 bg-white px-3 py-3 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                  />
                  <ErrorMessage
                    name="expense_date"
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
                        {CategoryDisplay[c]}
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
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <div className="relative">
                        <Field
                          as="select"
                          name="currency"
                          className="appearance-none bg-transparent pr-6 text-sm font-medium text-neutral-700 outline-none"
                        >
                          {Currencies.map((c) => (
                            <option key={c} value={c}>
                              {CurrencyPrefix[c]} {c}
                            </option>
                          ))}
                        </Field>
                        <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                      </div>
                    </div>
                    <Field
                      name="amount"
                      inputMode="decimal"
                      placeholder="Enter amount"
                      className="w-full rounded-2xl border border-neutral-300 bg-white py-3 pl-23  text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                    />
                  </div>
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
                className="w-full rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ backgroundColor: BRAND_PURPLE }}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Saving...' : 'Save expense'}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </Modal>
  );
}
