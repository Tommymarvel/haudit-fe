'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { StatCard } from '@/components/dashboard/StatCard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { Calendar, Plus, ChevronDown, Table2 } from 'lucide-react';
import { Menu } from '@/components/ui/Menu';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import AdvanceRowActions from './AdvanceRowActions';
import AdvanceDetailsModal, { AdvanceDetails } from './AdvanceDetailsModal';
import RepaymentModal from './RepaymentModal';
import AddAdvanceModal, { NewAdvancePayload } from './AddAdvanceModal';
import { BRAND } from '@/lib/brand';
import { useAdvance } from '@/hooks/useAdvance';
import { uploadFile } from '@/lib/utils/upload';
import { Select } from '@/components/ui/Select';

type Row = {
  id: string;
  date: string;
  amount: number;
  type: 'Personal' | 'Marketing';
  status: 'Repaid' | 'Outstanding' | 'Pending';
  source: string;
  totalAdvance?: number;
  repaidAdvance?: number;
  advanceBalance?: number;
  phone?: string;
  email?: string;
};

const RecordLabelAdvance = () => {
  const {
    advances,
    overview,
    marketingTrend,
    personalTrend,
    typePercentage,
    createAdvance,
    createRepayment,
    getRepayments,
  } = useAdvance();
  const [tab, setTab] = useState<'analytics' | 'source'>('analytics');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [openDetails, setOpenDetails] = useState(false);
  const [detailsData, setDetailsData] = useState<AdvanceDetails | null>(null);
  const [openRepay, setOpenRepay] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<Row | null>(null);

  const rows: Row[] = useMemo(() => {
    if (!advances) return [];
    return advances.map((adv) => ({
      id: adv._id,
      date: new Date((adv.createdAt || adv.created_at) as string).toLocaleDateString(),
      amount: adv.amount,
      type: ((() => {
        const t = (adv.advance_type || '').toLowerCase();
        return t === 'marketting' || t === 'marketing' ? 'Marketing' : 'Personal';
      })()) as 'Personal' | 'Marketing',
      status: (adv.repayment_status.charAt(0).toUpperCase() +
        adv.repayment_status.slice(1)) as 'Repaid' | 'Outstanding' | 'Pending',
      source: adv.advance_source_name,
      totalAdvance: adv.amount,
      repaidAdvance: adv.repaid_amount ?? 0,
      advanceBalance: Math.max(0, adv.amount - (adv.repaid_amount ?? 0)),
      phone: adv.advance_source_phn,
      email: adv.advance_source_email,
    }));
  }, [advances]);

  const kpis = useMemo(() => {
    if (!overview) return { sources: 0, total: 0, repaid: 0 };
    return {
      sources: overview.totalAdvanceSources,
      total: overview.totalAdvanceUSD,
      repaid: overview.totalRepaidUSD,
    };
  }, [overview]);

  const charts = useMemo(() => {
    const marketingTrendData = (marketingTrend || []).map((item) => ({
      label: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: item.totalUSD,
    }));

    const personalTrendData = (personalTrend || []).map((item) => ({
      label: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: item.totalUSD,
    }));

    const realDonut = [
      { name: 'Marketing', value: typePercentage?.marketting?.totalUSD || 0, color: BRAND.purple },
      { name: 'Personal', value: typePercentage?.personal?.totalUSD || 0, color: BRAND.green },
    ];

    return {
      marketing: marketingTrendData,
      personal: personalTrendData,
      donut: realDonut,
    };
  }, [marketingTrend, personalTrend, typePercentage]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (status === 'All' || r.status === status) &&
          (q === '' || r.source.toLowerCase().includes(q.toLowerCase()))
      ),
    [q, status, rows]
  );

  const openDetailsFor = async (r: Row) => {
    try {
      const repayments = await getRepayments(r.id);
      const repaidAmount = repayments.reduce((sum, rep) => sum + rep.amount, 0);
      const fullAdvance = advances?.find((a) => a._id === r.id);

      let remainingBalance = r.amount;
      const historyWithBalance = repayments
        .map((rep) => {
          const repaidAmt = rep.amount;
          remainingBalance -= repaidAmt;
          const dateObj = new Date(rep.createdAt);
          return {
            date: dateObj.toLocaleDateString(),
            time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            repaidAmount: repaidAmt,
            balanceAmount: Math.max(0, remainingBalance),
            proofs: rep.proof_of_payment ? [rep.proof_of_payment] : [],
          };
        })
        .reverse();

      setDetailsData({
        id: r.id,
        date: r.date,
        status: r.status,
        amount: r.amount,
        repaidAmount,
        type: r.type,
        source: r.source,
        phone: r.phone || '',
        email: r.email || '',
        proofs: fullAdvance?.proof_of_payment ? [fullAdvance.proof_of_payment] : [],
        purpose: fullAdvance?.purpose || '',
        history: historyWithBalance,
      });
      setOpenDetails(true);
    } catch (error) {
      console.error('Failed to fetch details', error);
    }
  };

  const handleRepayClick = (r: Row) => {
    setSelectedAdvance(r);
    setOpenRepay(true);
  };

  const outstandingAdvances = useMemo(
    () =>
      rows
        .filter((r) => r.status === 'Outstanding')
        .map((r) => ({
          id: r.id,
          source: r.source,
          amount: r.amount,
          balance: r.advanceBalance || r.amount,
        })),
    [rows]
  );

  return (
    <div>
      {/* Header row */}
      <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#3C3C3C]">
            Welcome to Advance-O-Meter
          </h1>
          <p className="text-base text-[#777777]">
            Track and get more info on your advance request
          </p>
        </div>
        <div className="w-full lg:w-fit grid grid-cols-2 gap-2 lg:flex">
          <Button variant="outline" className="w-full bg-[#EAEAEA] rounded-2xl lg:w-auto">
            <Calendar className="h-4 w-4" /> Year
          </Button>

          <Menu
            trigger={
              <Button
                variant="outline"
                className="w-full bg-[#EAEAEA] rounded-2xl lg:w-auto gap-2"
              >
                <svg width="15" height="17" viewBox="0 0 15 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M7.98833 0C8.37963 9.56093e-05 8.75841 0.137862 9.05833 0.389167L9.16667 0.488333L12.845 4.16667C13.1217 4.44335 13.2922 4.80857 13.3267 5.19833L13.3333 5.345V8.33333H11.6667V6.66667H7.91667C7.60593 6.66665 7.30634 6.5509 7.07632 6.34198C6.84629 6.13307 6.70233 5.84597 6.6725 5.53667L6.66667 5.41667V1.66667H1.66667V15H6.66667V16.6667H1.66667C1.24619 16.6668 0.841195 16.508 0.532877 16.2221C0.224559 15.9362 0.0357029 15.5443 0.00416685 15.125L8.35567e-08 15V1.66667C-0.000132983 1.24619 0.158672 0.841194 0.444581 0.532877C0.73049 0.224559 1.12237 0.0357028 1.54167 0.00416676L1.66667 0H7.98833ZM12.2558 10.3875L14.6125 12.7442C14.7687 12.9004 14.8565 13.1124 14.8565 13.3333C14.8565 13.5543 14.7687 13.7662 14.6125 13.9225L12.2558 16.2792C12.179 16.3588 12.087 16.4222 11.9853 16.4659C11.8837 16.5096 11.7743 16.5326 11.6637 16.5335C11.553 16.5345 11.4433 16.5134 11.3409 16.4715C11.2385 16.4296 11.1454 16.3677 11.0672 16.2895C10.9889 16.2113 10.927 16.1182 10.8851 16.0158C10.8432 15.9134 10.8222 15.8036 10.8231 15.693C10.8241 15.5823 10.8471 15.473 10.8907 15.3713C10.9344 15.2697 10.9979 15.1777 11.0775 15.1008L12.0117 14.1667H8.33333C8.11232 14.1667 7.90036 14.0789 7.74408 13.9226C7.5878 13.7663 7.5 13.5543 7.5 13.3333C7.5 13.1123 7.5878 12.9004 7.74408 12.7441C7.90036 12.5878 8.11232 12.5 8.33333 12.5H12.0117L11.0775 11.5658C10.9211 11.4096 10.8332 11.1976 10.8332 10.9765C10.8331 10.7555 10.9208 10.5435 11.0771 10.3871C11.2333 10.2307 11.4453 10.1428 11.6664 10.1427C11.8874 10.1427 12.0995 10.2304 12.2558 10.3867V10.3875ZM8.33333 2.01167V5H11.3217L8.33333 2.01167Z" fill="#2D2D2D" />
                </svg>
                Export <ChevronDown className="h-4 w-4" />
              </Button>
            }
            items={[
              { label: 'Export analytics', onClick: () => {} },
              { label: 'Export data', onClick: () => {} },
            ]}
          />

          <Menu
            trigger={
              <Button
                variant="primary"
                className="col-span-2 w-full rounded-2xl lg:col-span-1 lg:w-auto gap-2"
                style={{ backgroundColor: BRAND.purple }}
              >
                <Plus className="h-4 w-4" /> Record Advance <ChevronDown className="h-4 w-4" />
              </Button>
            }
            items={[
              { label: 'Add new advance', onClick: () => setOpenAdd(true) },
              { label: 'Advance repayment', onClick: () => setOpenRepay(true) },
            ]}
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-5 flex flex-nowrap lg:grid lg:grid-cols-3 gap-4 overflow-x-auto lg:overflow-x-visible pb-2">
        <StatCard
          className="min-w-[280px] lg:min-w-0 flex-shrink-0"
          title="Total advance source"
          value={kpis.sources}
          icon={<Image src="/svgs/advance.svg" width={48} height={48} alt="haudit" />}
        />
        <StatCard
          className="min-w-[280px] lg:min-w-0 flex-shrink-0"
          title="Total Advance"
          value={`$${kpis.total.toLocaleString()}`}
          icon={<Image src="/svgs/moneybag.svg" width={48} height={48} alt="haudit" />}
        />
        <StatCard
          className="min-w-[280px] lg:min-w-0 flex-shrink-0"
          title="Repaid Advance"
          value={`$${kpis.repaid.toLocaleString()}`}
          icon={<Image src="/svgs/repaid.svg" width={48} height={48} alt="haudit" />}
        />
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-neutral-200">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setTab('analytics')}
            className={`px-1 py-2 text-sm ${
              tab === 'analytics'
                ? 'text-neutral-900 font-medium border-b-2 border-[color:#7B00D4]'
                : 'text-neutral-500'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setTab('source')}
            className={`px-1 py-2 text-sm ${
              tab === 'source'
                ? 'text-neutral-900 font-medium border-b-2 border-[color:#7B00D4]'
                : 'text-neutral-500'
            }`}
          >
            Advance source
          </button>
        </div>
      </div>

      {/* Content */}
      {tab === 'request' && (
        <div className="mt-8 bg-white rounded-3xl border border-neutral-200 overflow-hidden">
          <div className="p-5 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#F4F4F4] lg:bg-white">
            <h3 className="text-sm font-medium text-neutral-700">Advance request</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input
                  type="text"
                  placeholder="Search advance"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full sm:w-64 rounded-xl border border-neutral-200 bg-[#F4F4F4] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>
              <Select
                value={status}
                onChange={setStatus}
                className="min-w-[120px] h-[42px] px-4"
                options={[
                  { label: 'All status', value: 'All status' },
                  { label: 'Approved', value: 'Approved' },
                  { label: 'Pending', value: 'Pending' },
                  { label: 'Rejected', value: 'Rejected' },
                ]}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-neutral-500 font-medium bg-[#F4F4F4]">
                <tr>
                  <th className="px-6 py-4 font-medium">ID</th>
                  <th className="px-6 py-4 font-medium flex items-center gap-1 cursor-pointer">Date <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" /></svg></th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Advance type</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Artist</th>
                  <th className="px-6 py-4 font-medium text-right">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20">
                      <div className="flex flex-col items-center justify-center text-center">
                        <Table2 className="h-5 w-5 text-[#7B00D4]" />
                        <p className="mt-2 text-sm font-medium text-neutral-700">No records yet</p>
                        <p className="mt-1 max-w-xs text-xs text-neutral-500">
                          Entries will appear here once financial data is added by your label.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((advance, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/50">
                      <td className="px-6 py-4 text-neutral-900 font-medium">{advance.id}</td>
                      <td className="px-6 py-4 text-neutral-500">{advance.date}</td>
                      <td className="px-6 py-4 text-neutral-900 font-medium">{advance.amount}</td>
                      <td className="px-6 py-4 text-neutral-600">{advance.type}</td>
                      <td className="px-6 py-4">
                        <StatusPill label={advance.status as 'Repaid' | 'Outstanding' | 'Pending' | 'Approved'} />
                      </td>
                      <td className="px-6 py-4 text-neutral-600">{advance.artist}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 text-neutral-400 justify-end">
                          <button className="hover:text-[#7B00D4]"><MessageSquare className="h-4 w-4" /></button>
                          <button className="hover:text-[#7B00D4]"><MoreVertical className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordLabelAdvance;
