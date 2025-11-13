'use client';
import Modal from '@/components/ui/Modal';
import { StatusPill } from '@/components/ui/StatusPill';
import {

  Calendar,
  DollarSign,
  RefreshCw,
  FileText,
  User,
  Phone,
  Mail,
  Paperclip,
} from 'lucide-react';

export type AdvanceDetails = {
  id: string;
  date: string; // 03-May-2025
  status: 'Repaid' | 'Outstanding' | 'Pending';
  amount: number; // 1500
  repaidAmount: number; // 1500
  type: 'Personal' | 'Marketing';
  source: string; // Chocolate City
  phone: string;
  email: string;
  proofs?: string[]; // filenames
  purpose?: string; // long text
  history?: {
    date: string;
    repaidAmount: number;
    balanceAmount: number;
    proofs?: string[];
  }[];
};

export default function AdvanceDetailsModal({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: AdvanceDetails | null;
}) {
  if (!open || !data) return null;
  const currency = (n: number) => `$${n.toLocaleString()}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      headerVariant="none" // <— no built-in header
      closeVariant="island" // <— one floating X outside
      size="xl"
    >
      {/* Header bar */}
      <div className="rounded-t-2xl border border-[#D5D5D5] px-4 py-3">
        <div className="text-sm text-neutral-500">
          Advance O Meter / {data.id}
        </div>
      </div>

      <div className="p-4 md:p-6 max-h-[calc(100vh-6rem)] overflow-y-auto">
        {/* Title + 2-column summary */}
        <h2 className="mb-4 text-2xl font-semibold text-neutral-900">
          {data.id}
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* left */}
          <div className="space-y-3">
            <Row
              icon={<Calendar className="h-4 w-4" />}
              label="Date"
              value={data.date}
            />
            <Row
              icon={<FileText className="h-4 w-4" />}
              label="Status"
              value={<StatusPill label={data.status} />}
            />
            <Row
              icon={<DollarSign className="h-4 w-4" />}
              label="Advance Amount"
              value={currency(data.amount)}
            />
            <Row
              icon={<RefreshCw className="h-4 w-4" />}
              label="Repaid Amount"
              value={currency(data.repaidAmount)}
            />
            <Row
              icon={<FileText className="h-4 w-4" />}
              label="Advance Type"
              value={data.type}
            />
          </div>

          {/* right */}
          <div className="space-y-3">
            <Row
              icon={<User className="h-4 w-4" />}
              label="Source"
              value={data.source}
            />
            <Row
              icon={<Phone className="h-4 w-4" />}
              label="Phone number"
              value={data.phone}
            />
            <Row
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              value={data.email}
            />
            <Row
              icon={<Paperclip className="h-4 w-4" />}
              label="Proof of payment"
              value={
                <div className="flex flex-wrap gap-2">
                  {(data.proofs ?? []).map((p, i) => (
                    <span
                      key={i}
                      className="truncate rounded-lg bg-neutral-100 px-2 py-1 text-xs text-neutral-700"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              }
            />
          </div>
        </div>

        {/* Purpose + History */}
        <div className="mt-5  grid grid-cols-1 gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-[#D5D5D5]">
            <header className="rounded-t-2xl bg-white border-b border-[#D5D5D5] px-3 py-2 text-sm font-medium">
              Purpose of Advance
            </header>
            <div className="p-3 text-sm text-neutral-700 leading-6">
              {data.purpose || '—'}
            </div>
          </section>

          <section className="rounded-2xl border border-[#D5D5D5]">
            <header className="rounded-t-2xl border-b border-[#D5D5D5] px-3 py-2 text-sm font-medium">
              Repayment History
            </header>
            <div className="p-3 text-sm bg-neutral-50">
              {data.history?.length ? (
                <dl className="space-y-2">
                  {data.history.map((h, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-2 gap-2 rounded-xl  p-3"
                    >
                      <dt className="text-neutral-500">Date</dt>
                      <dd className="text-neutral-900">{h.date}</dd>
                      <dt className="text-neutral-500">Repaid Amount</dt>
                      <dd className="text-neutral-900">
                        {currency(h.repaidAmount)}
                      </dd>
                      <dt className="text-neutral-500">Balance Amount</dt>
                      <dd className="text-neutral-900">
                        {currency(h.balanceAmount)}
                      </dd>
                      {h.proofs && h.proofs.length > 0 && (
                        <>
                          <dt className="text-neutral-500">Repayment Proof</dt>
                          <dd className="flex flex-wrap gap-2">
                            {h.proofs.map((p, j) => (
                              <span
                                key={j}
                                className="truncate rounded-lg bg-neutral-100 px-2 py-1 text-xs text-neutral-700"
                              >
                                {p}
                              </span>
                            ))}
                          </dd>
                        </>
                      )}
                    </div>
                  ))}
                </dl>
              ) : (
                <div className="text-neutral-500">No history yet.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </Modal>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[20px_1fr] items-center gap-3">
      <div className="text-neutral-500">{icon}</div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-neutral-500">{label}</span>
        <span className="text-sm font-medium text-neutral-900">{value}</span>
      </div>
    </div>
  );
}
