'use client';
import Modal from '@/components/ui/Modal';
import FileDropzone from '@/components/ui/FIleDropzone';
import { Select } from '@/components/ui/Select';
import { Formik, Form, Field, ErrorMessage, useFormikContext } from 'formik';
import * as Yup from 'yup';
import Image from 'next/image';
import { Loader2, Pencil } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatAmountInput, parseAmountInput } from '@/lib/utils/currency';
import axiosInstance from '@/lib/axiosinstance';

const BRAND_PURPLE = '#7B00D4';

const Currencies = ['NGN', 'USD'] as const;
const RecoupableValues = ['Yes', 'No'] as const;

type BankOption = { label: string; value: string; code: string };

const AdvanceTypeOptions = [
  { value: 'personal', label: 'Personal' },
  { value: 'marketting', label: 'Marketing' },
];

const parseAmountForValidation = (originalValue: unknown) => {
  if (originalValue === undefined || originalValue === null) return undefined;
  if (typeof originalValue === 'string' && originalValue.trim() === '') return undefined;
  const parsed = parseAmountInput(originalValue);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

function createSchema(requireArtistName: boolean, requireDate: boolean, requireBankDetails: boolean) {
  return Yup.object({
    artistId: requireArtistName
      ? Yup.string().trim().required('Artist is required')
      : Yup.string().optional(),
    expense_date: requireDate
      ? Yup.string().required('Date is required')
      : Yup.string().optional(),
    advance_type: Yup.string().required('Advance type is required'),
    currency: Yup.string().required('Currency is required'),
    amount: Yup.number()
      .transform((_value, originalValue) => parseAmountForValidation(originalValue))
      .typeError('Enter a valid amount')
      .min(1, 'Must be at least 1')
      .required('Amount is required'),
    recoupable: Yup.string().optional(),
    description: Yup.string().max(800, 'Too long').optional(),
    proofs: Yup.array()
      .of(Yup.mixed<File>())
      .min(1, 'Supporting document is required')
      .required('Supporting document is required'),
    account_number: requireBankDetails
      ? Yup.string().trim().required('Account number is required')
      : Yup.string().optional(),
    bank: requireBankDetails
      ? Yup.string().required('Bank is required')
      : Yup.string().optional(),
    bank_code: Yup.string().optional(),
    account_name: Yup.string().optional(),
  });
}

export type NewExpensesPayload = {
  artistId?: string;
  expense_date: string;
  advance_type?: string;
  amount: number;
  currency: string;
  recoupable?: string;
  description?: string;
  proofs?: File[];
  account_number?: string;
  bank?: string;
  account_name?: string;
};

type FormValues = {
  artistId: string;
  expense_date: string;
  advance_type: string;
  amount: string | number;
  currency: (typeof Currencies)[number];
  recoupable: string;
  description: string;
  proofs: File[];
  account_number: string;
  bank: string;
  bank_code: string;
  account_name: string;
};

type ArtistOption = { id: string; name: string };

function BankAccountSection({ fieldClass }: { fieldClass: string }) {
  const { values, setFieldValue } = useFormikContext<FormValues>();
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [verifying, setVerifying] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    axiosInstance
      .get('/payments/listbanks', { params: { currency: 'NGN' } })
      .then((res) => {
        const raw = res.data;
        const list: Array<{ name: string; code: string }> = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.result)
            ? raw.result
            : Array.isArray(raw?.data)
              ? raw.data
              : [];
        setBanks(list.map((b) => ({ label: b.name, value: b.name, code: b.code })));
      })
      .catch(() => {});
  }, []);

  const { account_number, bank_code } = values;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!account_number || account_number.length !== 10 || !bank_code) return;

    debounceRef.current = setTimeout(async () => {
      setVerifying(true);
      try {
        const res = await axiosInstance.get('/payments/validateacc', {
          params: { acc_no: account_number, bank_code, currency: 'NGN' },
        });
        const raw = res.data;
        const name: string = raw?.result?.account_name ?? raw?.account_name ?? '';
        setFieldValue('account_name', name);
      } catch {
        setFieldValue('account_name', '');
      } finally {
        setVerifying(false);
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [account_number, bank_code, setFieldValue]);

  return (
    <>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          Account Number
        </label>
        <div className="relative">
          <Field
            name="account_number"
            type="text"
            inputMode="numeric"
            maxLength={10}
            placeholder="Enter 10-digit account number"
            className={fieldClass + ' pr-10'}
          />
          <Pencil className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        </div>
        <ErrorMessage name="account_number" component="p" className="mt-1 text-xs text-rose-600" />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">Bank</label>
        <Select
          value={values.bank}
          onChange={(v) => {
            setFieldValue('bank', v);
            const found = banks.find((b) => b.value === v);
            setFieldValue('bank_code', found?.code ?? '');
            setFieldValue('account_name', '');
          }}
          options={banks}
          placeholder={banks.length === 0 ? 'Loading banks...' : 'Select bank'}
          className="h-12 rounded-2xl border-neutral-300 bg-white pr-10 text-sm"
          disabled={banks.length === 0}
          searchable
        />
        <ErrorMessage name="bank" component="p" className="mt-1 text-xs text-rose-600" />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          Account Name
        </label>
        <div className="relative">
          <Field
            name="account_name"
            type="text"
            readOnly
            placeholder={verifying ? 'Verifying...' : 'Auto-filled after verification'}
            className={fieldClass + ' pr-10 bg-neutral-50 cursor-not-allowed'}
          />
          {verifying
            ? <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-neutral-400" />
            : <Pencil className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          }
        </div>
        <ErrorMessage name="account_name" component="p" className="mt-1 text-xs text-rose-600" />
      </div>
    </>
  );
}

export default function AddExpensesModal({
  open,
  onClose,
  onSubmit,
  recordLabelFields = false,
  initialArtistId = '',
  artistOptions = [],
  submitLabel = 'Submit request',
  personalEligibleAmount,
  marketingEligibleAmount,
  initialAccountNumber = '',
  initialBank = '',
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewExpensesPayload) => Promise<void> | void;
  recordLabelFields?: boolean;
  initialArtistId?: string;
  artistOptions?: ArtistOption[];
  submitLabel?: string;
  personalEligibleAmount?: string;
  marketingEligibleAmount?: string;
  initialAccountNumber?: string;
  initialBank?: string;
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
      .sort((l, r) => l.name.localeCompare(r.name, undefined, { sensitivity: 'base' }));
  }, [artistOptions]);

  const showBankingDetails = !recordLabelFields;
  const validationSchema = useMemo(
    () => createSchema(recordLabelFields, recordLabelFields, showBankingDetails),
    [recordLabelFields, showBankingDetails],
  );

  const fieldClass =
    'h-12 w-full rounded-2xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100';

  return (
    <Modal open={open} onClose={onClose} headerVariant="none" closeVariant="island" size="md">
      <div className="m-5 lg:m-10">
        <div className="mt-1 flex flex-col items-center text-center">
          <Image src="/haudit-logo.svg" alt="Haudit" width={48} height={48} />
          <h2 className="text-2xl font-medium text-[#1F1F1F]">Expenses request form</h2>
          <p className="mt-1 text-sm text-[#959595]">
            Provide details of the expense requiring funding.
          </p>
        </div>

        <Formik<FormValues>
          initialValues={{
            artistId: initialArtistId || '',
            expense_date: '',
            advance_type: '',
            amount: '',
            currency: 'NGN',
            recoupable: '',
            description: '',
            proofs: [],
            account_number: initialAccountNumber,
            bank: initialBank,
            bank_code: '',
            account_name: '',
          }}
          enableReinitialize
          validationSchema={validationSchema}
          onSubmit={async (vals, { setSubmitting }) => {
            try {
              const parsedAmount = parseAmountInput(vals.amount);
              const today = new Date().toISOString().split('T')[0];
              await onSubmit({
                artistId: vals.artistId?.trim() || undefined,
                expense_date: vals.expense_date || today,
                advance_type: vals.advance_type || undefined,
                amount: Number.isFinite(parsedAmount) ? parsedAmount : 0,
                currency: vals.currency,
                recoupable: vals.recoupable || undefined,
                description: vals.description?.trim() || undefined,
                proofs: vals.proofs,
                account_number: vals.account_number?.trim() || undefined,
                bank: vals.bank?.trim() || undefined,
                account_name: vals.account_name?.trim() || undefined,
              });
              onClose();
            } catch {
              // error already toasted by hook; keep modal open
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, setFieldValue, values }) => (
            <Form className="mx-auto mt-6 w-full max-w-xl space-y-4">

              {/* ── ADMIN VIEW: Artist Name + Date first ── */}
              {recordLabelFields && (
                <div>
                  <label className="mb-3 block text-sm font-medium text-neutral-700">
                    Artist Name
                  </label>
                  <Select
                    value={values.artistId}
                    onChange={(v) => setFieldValue('artistId', v)}
                    placeholder={
                      normalizedArtistOptions.length > 0
                        ? 'Select artist name'
                        : 'No artists available'
                    }
                    className="h-12 rounded-2xl border-neutral-300 bg-white pr-10 text-sm"
                    options={normalizedArtistOptions.map((a) => ({ label: a.name, value: a.id }))}
                    disabled={normalizedArtistOptions.length === 0}
                  />
                  <ErrorMessage name="artistId" component="p" className="mt-1 text-xs text-rose-600" />
                </div>
              )}

              {recordLabelFields && (
                <div>
                  <label className="mb-3 block text-sm font-medium text-neutral-700">Date</label>
                  <Field
                    name="expense_date"
                    type="date"
                    className="w-full rounded-2xl border border-neutral-300 bg-white px-3 py-3 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                  />
                  <ErrorMessage name="expense_date" component="p" className="mt-1 text-xs text-rose-600" />
                </div>
              )}

              {/* ── Amount ── */}
              <div>
                <label className="mb-3 block text-sm font-medium text-neutral-700">Amount</label>
                <div className="flex items-center overflow-hidden rounded-2xl border border-neutral-300 bg-white focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-100">
                  <select
                    value={values.currency}
                    onChange={(e) => setFieldValue('currency', e.target.value)}
                    className="h-12 shrink-0 border-0 border-r border-neutral-200 bg-neutral-50 pl-3 pr-2 text-sm text-neutral-700 outline-none"
                  >
                    {Currencies.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input
                    name="amount"
                    inputMode="decimal"
                    placeholder="Enter amount"
                    value={values.amount}
                    onChange={(e) => setFieldValue('amount', formatAmountInput(e.target.value))}
                    className="min-w-0 flex-1 bg-transparent py-3 pl-3 pr-4 text-sm outline-none"
                  />
                </div>

                {showBankingDetails && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', background: 'transparent' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '9999px', padding: '4px 12px', fontSize: '11px', fontWeight: 600, color: '#7B00D4', backgroundColor: '#EDE1FF', border: 'none' }}>
                      Personal Advance: {personalEligibleAmount ?? '$0.00'}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '9999px', padding: '4px 12px', fontSize: '11px', fontWeight: 600, color: '#00B241', backgroundColor: '#D4F7E3', border: 'none' }}>
                      Marketing Advance: {marketingEligibleAmount ?? '$0.00'}
                    </span>
                  </div>
                )}

                <ErrorMessage name="amount" component="p" className="mt-1 text-xs text-rose-600" />
              </div>

              {/* ── Banking details (label artist only) ── */}
              {showBankingDetails && <BankAccountSection fieldClass={fieldClass} />}

              {/* ── Advance Type ── */}
              <div>
                <label className="mb-3 block text-sm font-medium text-neutral-700">Advance Type</label>
                <Select
                  value={values.advance_type}
                  onChange={(v) => setFieldValue('advance_type', v)}
                  placeholder="Select advance type"
                  className="h-12 rounded-2xl border-neutral-300 bg-white pr-10 text-sm"
                  options={AdvanceTypeOptions}
                />
                <ErrorMessage name="advance_type" component="p" className="mt-1 text-xs text-rose-600" />
              </div>

              {/* ── Recoupable ── */}
              <div>
                <label className="mb-3 block text-sm font-medium text-neutral-700">Recoupable</label>
                <Select
                  value={values.recoupable}
                  onChange={(v) => setFieldValue('recoupable', v)}
                  placeholder="Select an option"
                  className="h-12 rounded-2xl border-neutral-300 bg-white pr-10 text-sm"
                  options={RecoupableValues.map((v) => ({ value: v, label: v }))}
                />
                <ErrorMessage name="recoupable" component="p" className="mt-1 text-xs text-rose-600" />
              </div>

              {/* ── Upload ── */}
              <div>
                <label className="mb-3 block text-sm font-medium text-neutral-700">
                  Upload supporting document <span className="text-rose-500">*</span>
                </label>
                <FileDropzone onFiles={(files) => setFieldValue('proofs', files)} className="bg-white" />
                {values.proofs?.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-neutral-600">
                    {values.proofs.map((f, i) => <li key={i}>{f.name}</li>)}
                  </ul>
                )}
                <ErrorMessage name="proofs" component="p" className="mt-1 text-xs text-rose-600" />
              </div>

              {/* ── Purpose / Description ── */}
              <div>
                <label className="mb-3 block text-sm font-medium text-neutral-700">Purpose</label>
                <Field
                  as="textarea"
                  rows={4}
                  name="description"
                  placeholder="Give a detailed purpose of the request"
                  className="w-full resize-none rounded-2xl border border-neutral-300 bg-white px-3 py-3 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                />
                <ErrorMessage name="description" component="p" className="mt-1 text-xs text-rose-600" />
              </div>

              {/* ── Submit ── */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-60"
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
