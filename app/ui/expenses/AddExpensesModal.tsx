'use client';
import Modal from '@/components/ui/Modal';
import FileDropzone from '@/components/ui/FIleDropzone';
import { Select } from '@/components/ui/Select';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Image from 'next/image';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { formatAmountInput, parseAmountInput } from '@/lib/utils/currency';

const BRAND_PURPLE = '#7B00D4';

const Categories = ['marketting', 'production', 'personal'] as const;
type Category = (typeof Categories)[number];

const Currencies = ['NGN', 'USD'] as const;
const RecoupableValues = ['Yes', 'No'] as const;

// Currency prefix mapping to display symbols/text
const CurrencyPrefix: Record<(typeof Currencies)[number], string> = {
  NGN: 'NGN',
  USD: '$',
};

// Display names for categories
const CategoryDisplay: Record<Category, string> = {
  marketting: 'Marketing',
  production: 'Production',
  personal: 'Personal',
};

const parseAmountForValidation = (originalValue: unknown) => {
  if (originalValue === undefined || originalValue === null) return undefined;
  if (typeof originalValue === 'string' && originalValue.trim() === '') return undefined;
  const parsed = parseAmountInput(originalValue);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

function createSchema(requireArtistName: boolean) {
  return Yup.object({
    artistId: requireArtistName
      ? Yup.string().trim().required('Artist is required')
      : Yup.string().optional(),
    expense_date: Yup.string().required('Date is required'),
    category: Yup.mixed<Category>()
      .oneOf([...Categories] as readonly Category[], 'Select a valid category')
      .required('Category is required'),
    currency: Yup.string().required('Currency is required'),
    amount: Yup.number()
      .transform((_value, originalValue) => parseAmountForValidation(originalValue))
      .typeError('Enter a valid amount')
      .min(1, 'Must be at least 1')
      .required('Amount is required'),
    recoupable: Yup.string().optional(),
    description: Yup.string().max(800, 'Too long').optional(),
    proofs: Yup.array().of(Yup.mixed<File>()).optional(),
  });
}

export type NewExpensesPayload = {
  artistId?: string;
  expense_date: string;
  category: Category;
  amount: number;
  currency: string;
  recoupable?: string;
  description?: string;
  proofs?: File[];
};

type ArtistOption = {
  id: string;
  name: string;
};

export default function AddExpensesModal({
  open,
  onClose,
  onSubmit,
  recordLabelFields = false,
  initialArtistId = '',
  artistOptions = [],
  submitLabel = 'Save expense',
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewExpensesPayload) => Promise<void> | void;
  recordLabelFields?: boolean;
  initialArtistId?: string;
  artistOptions?: ArtistOption[];
  submitLabel?: string;
}) {
  const normalizedArtistOptions = useMemo(() => {
    const uniqueById = new Map<string, string>();
    artistOptions.forEach((option) => {
      const id = option.id.trim();
      const name = option.name.trim();
      if (!id || !name) return;
      if (!uniqueById.has(id)) uniqueById.set(id, name);
    });

    return Array.from(uniqueById.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) =>
        left.name.localeCompare(right.name, undefined, { sensitivity: 'base' })
      );
  }, [artistOptions]);

  const shouldRequireArtistName = recordLabelFields;
  const validationSchema = useMemo(
    () => createSchema(shouldRequireArtistName),
    [shouldRequireArtistName]
  );

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
            artistId: initialArtistId || '',
            expense_date: '',
            category: '',
            amount: '',
            currency: 'USD',
            recoupable: '',
            description: '',
            proofs: [] as File[],
          }}
          validationSchema={validationSchema}
          onSubmit={async (vals, { setSubmitting }) => {
            try {
              const parsedAmount = parseAmountInput(vals.amount);
              await onSubmit({
                artistId: vals.artistId?.trim() || undefined,
                expense_date: vals.expense_date,
                category: vals.category as Category,
                amount: Number.isFinite(parsedAmount) ? parsedAmount : 0,
                currency: vals.currency,
                recoupable: vals.recoupable || undefined,
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
              <div className="space-y-4">
                {recordLabelFields && (
                  <div>
                    <label className="mb-3 block text-sm font-medium text-neutral-700">
                      Artist Name
                    </label>
                    <Select
                      value={values.artistId}
                      onChange={(value) => setFieldValue('artistId', value)}
                      placeholder={
                        normalizedArtistOptions.length > 0
                          ? 'Select artist name'
                          : 'No artists available'
                      }
                      className="h-12 rounded-2xl border-neutral-300 bg-white pr-10 text-sm focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                      options={normalizedArtistOptions.map((artist) => ({
                        label: artist.name,
                        value: artist.id,
                      }))}
                      disabled={normalizedArtistOptions.length === 0}
                    />
                    <ErrorMessage
                      name="artistId"
                      component="p"
                      className="mt-1 text-xs text-rose-600"
                    />
                  </div>
                )}

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
                  <Select
                    value={values.category}
                    onChange={(value) => setFieldValue('category', value)}
                    placeholder="Select category"
                    className="h-12 rounded-2xl border-neutral-300 bg-white pr-10 text-sm focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                    options={Categories.map((c) => ({
                      value: c,
                      label: CategoryDisplay[c],
                    }))}
                  />
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
                    <input
                      name="amount"
                      inputMode="decimal"
                      placeholder="Enter amount"
                      value={values.amount}
                      onChange={(event) =>
                        setFieldValue('amount', formatAmountInput(event.target.value))
                      }
                      className="w-full rounded-2xl border border-neutral-300 bg-white py-3 pl-23  text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                    />
                  </div>
                  <ErrorMessage
                    name="amount"
                    component="p"
                    className="mt-1 text-xs text-rose-600"
                  />
                </div>

                {recordLabelFields && (
                  <div>
                    <label className="mb-3 block text-sm font-medium text-neutral-700">
                      Recoupable
                    </label>
                    <Select
                      value={values.recoupable}
                      onChange={(value) => setFieldValue('recoupable', value)}
                      placeholder="Select recoupable"
                      className="h-12 rounded-2xl border-neutral-300 bg-white pr-10 text-sm focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                      options={RecoupableValues.map((value) => ({
                        value,
                        label: value,
                      }))}
                    />
                    <ErrorMessage
                      name="recoupable"
                      component="p"
                      className="mt-1 text-xs text-rose-600"
                    />
                  </div>
                )}

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
                {isSubmitting ? 'Saving...' : submitLabel}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </Modal>
  );
}
