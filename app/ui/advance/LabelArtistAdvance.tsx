'use client';
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { StatCard } from '@/components/dashboard/StatCard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { Calendar, Table2 } from 'lucide-react';
import Image from 'next/image';
import AdvanceDetailsModal, { AdvanceDetails } from './AdvanceDetailsModal';
import { BRAND } from '@/lib/brand';
import { useAdvance } from '@/hooks/useAdvance';
import { Select } from '@/components/ui/Select';
import { toast } from 'react-toastify';

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

const LabelArtistAdvance = () => {
  const { advances, overview, marketingTrend, personalTrend, typePercentage, getRepayments } =
    useAdvance();
  const [tab, setTab] = useState<'analytics' | 'source'>('analytics');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [openDetails, setOpenDetails] = useState(false);
  const [detailsData, setDetailsData] = useState<AdvanceDetails | null>(null);

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
      toast.error('Failed to load advance details');
    }
  };

  return (
    <div>
      {/* Header row */}
      <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#3C3C3C]">Advance-O-Meter</h1>
          <p className="text-base text-[#777777]">View and track your advance history</p>
        </div>
        <div className="w-full lg:w-fit flex gap-2">
          <Button variant="outline" className="w-full bg-[#EAEAEA] rounded-2xl lg:w-auto">
            <Calendar className="h-4 w-4" /> Year
          </Button>
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
          {(['analytics', 'source'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-1 py-2 text-sm ${
                tab === t
                  ? 'text-neutral-900 font-medium border-b-2 border-[color:#7B00D4]'
                  : 'text-neutral-500'
              }`}
            >
              {t === 'analytics' ? 'Analytics' : 'Advance source'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'analytics' ? (
        <>
          <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ChartCard
              title="Marketing advance trend"
              variant="line"
              data={charts.marketing}
              xKey="label"
              yKey="value"
              color={BRAND.purple}
              bandFill="#F4F4F4"
              lineType="monotone"
            />
            <ChartCard
              title="Personal advance trend"
              variant="line"
              data={charts.personal}
              xKey="label"
              yKey="value"
              color={BRAND.green}
              bandFill="#F4F4F4"
              lineType="monotone"
            />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-6">
            <Card className="xl:col-span-2 h-[420px] flex flex-col">
              <CardBody className="p-0! flex flex-col h-full">
                <div className="flex flex-wrap items-center p-3 gap-3">
                  <div className="text-sm font-semibold text-[#3C3C3C]">Advance request</div>
                  <div className="lg:ml-auto flex lg:items-center lg:flex-row flex-col items-start gap-2">
                    <input
                      placeholder="Search advance"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      className="h-10 w-60 rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-100"
                    />
                    <Select
                      value={status}
                      onChange={setStatus}
                      className="w-[150px]"
                      options={[
                        { label: 'All', value: 'All' },
                        { label: 'Repaid', value: 'Repaid' },
                        { label: 'Outstanding', value: 'Outstanding' },
                        { label: 'Pending', value: 'Pending' },
                      ]}
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-x-auto overflow-y-auto">
                  <table className="w-full text-base">
                    <thead className="sticky top-0 z-10 text-left text-neutral-500 bg-[#F4F4F4]">
                      <tr>
                        <th className="py-3 pl-3 pr-4 whitespace-nowrap">Date</th>
                        <th className="py-3 pr-4 whitespace-nowrap">Amount</th>
                        <th className="py-3 pr-4 whitespace-nowrap">Advance type</th>
                        <th className="py-3 pr-4 whitespace-nowrap">Status</th>
                        <th className="py-3 pr-4 whitespace-nowrap">Advance source</th>
                        <th className="py-3 pr-4 whitespace-nowrap"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-20">
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
                        filtered.map((r, i) => (
                          <tr key={i} className="text-neutral-800">
                            <td className="py-3 pl-3 pr-4 whitespace-nowrap">{r.date}</td>
                            <td className="py-3 pr-4 whitespace-nowrap">${r.amount.toLocaleString()}</td>
                            <td className="py-3 pr-4 whitespace-nowrap">{r.type}</td>
                            <td className="py-3 pr-4 whitespace-nowrap">
                              <StatusPill label={r.status} />
                            </td>
                            <td className="py-3 pr-4 whitespace-nowrap">{r.source}</td>
                            <td className="py-3 pr-4 text-right whitespace-nowrap">
                              <button
                                onClick={() => openDetailsFor(r)}
                                className="text-sm text-[#7B00D4] hover:underline"
                              >
                                View details
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
            <div className="xl:col-span-1">
              <ChartCard
                title="Advance type"
                variant="donut"
                data={charts.donut}
                donutInnerText={'Total\nAdvance'}
                bandFill="#F4F4F4"
              />
            </div>
          </div>
        </>
      ) : (
        <Card className="flex-1 mt-8 h-[420px] flex flex-col">
          <CardBody className="p-0! flex flex-col h-full">
            <div className="flex flex-wrap items-center justify-between p-3 gap-3">
              <div className="text-sm font-semibold text-[#3C3C3C]">All advance source</div>
              <input
                placeholder="Search advance source"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-10 w-60 rounded-xl border border-neutral-200 bg-[#F4F4F4] px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-100"
              />
            </div>
            <div className="flex-1 overflow-x-auto overflow-y-auto">
              <table className="w-full text-base">
                <thead className="sticky top-0 z-10 text-left text-neutral-500 bg-[#F4F4F4]">
                  <tr>
                    <th className="py-3 pl-3 pr-4 whitespace-nowrap">Advance source</th>
                    <th className="py-3 pr-4 whitespace-nowrap">Total advance</th>
                    <th className="py-3 pr-4 whitespace-nowrap">Repaid advance</th>
                    <th className="py-3 pr-4 whitespace-nowrap">Advance balance</th>
                    <th className="py-3 pr-4 whitespace-nowrap">Phone number</th>
                    <th className="py-3 pr-3 whitespace-nowrap">Email address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20">
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
                    filtered.map((r, i) => (
                      <tr key={i} className="text-neutral-800">
                        <td className="py-3 pl-3 pr-4 whitespace-nowrap">{r.source}</td>
                        <td className="py-3 pr-4 whitespace-nowrap">${r.totalAdvance?.toLocaleString() || '0'}</td>
                        <td className="py-3 pr-4 whitespace-nowrap">${r.repaidAdvance?.toLocaleString() || '0'}</td>
                        <td className="py-3 pr-4 whitespace-nowrap">${r.advanceBalance?.toLocaleString() || '0'}</td>
                        <td className="py-3 pr-4 whitespace-nowrap">{r.phone || 'N/A'}</td>
                        <td className="py-3 pr-3 whitespace-nowrap">{r.email || 'N/A'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      <AdvanceDetailsModal
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        data={detailsData}
      />
    </div>
  );
};

export default LabelArtistAdvance;
