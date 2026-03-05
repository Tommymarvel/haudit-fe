'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusPill } from '@/components/ui/StatusPill';
import Image from 'next/image';
import { useAdvance } from '@/hooks/useAdvance';

const LabelArtistAdvance = () => {
  const { advances, overview } = useAdvance();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');

  const rows = useMemo(() => {
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
    }));
  }, [advances]);

  const kpis = useMemo(() => {
    if (!overview) return { total: 0, repaid: 0, outstanding: 0 };
    return {
      total: overview.totalAdvanceUSD,
      repaid: overview.totalRepaidUSD,
      outstanding: overview.outstandingUSD,
    };
  }, [overview]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (status === 'All' || r.status === status) &&
          (q === '' || r.source.toLowerCase().includes(q.toLowerCase()))
      ),
    [q, status, rows]
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col items-start gap-2 mb-6">
        <h1 className="text-2xl font-medium text-[#3C3C3C]">My Advances</h1>
        <p className="text-base text-[#777777]">View advances recorded for you by your label</p>
      </div>

      {/* KPIs */}
      <div className="mt-5 flex flex-nowrap lg:grid lg:grid-cols-3 gap-4 overflow-x-auto lg:overflow-x-visible pb-2">
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
        <StatCard
          className="min-w-[280px] lg:min-w-0 flex-shrink-0"
          title="Outstanding Balance"
          value={`$${kpis.outstanding.toLocaleString()}`}
          icon={<Image src="/svgs/advance.svg" width={48} height={48} alt="haudit" />}
        />
      </div>

      {/* Table */}
      <Card className="flex-1 mt-8">
        <CardBody className="p-0!">
          <div className="flex flex-wrap items-center justify-between p-3 gap-3">
            <div className="text-sm font-semibold text-[#3C3C3C]">All advances</div>
            <div className="lg:ml-auto flex lg:items-center lg:flex-row flex-col items-start gap-2">
              <input
                placeholder="Search advance"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-10 w-60 rounded-xl border border-neutral-200 bg-[#F4F4F4] px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-100"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm"
              >
                <option>All</option>
                <option>Repaid</option>
                <option>Outstanding</option>
                <option>Pending</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead className="text-left text-neutral-500 bg-[#F4F4F4]">
                <tr>
                  <th className="py-3 pl-3 pr-4 whitespace-nowrap">Date</th>
                  <th className="py-3 pr-4 whitespace-nowrap">Total Advance</th>
                  <th className="py-3 pr-4 whitespace-nowrap">Advance Type</th>
                  <th className="py-3 pr-4 whitespace-nowrap">Repaid</th>
                  <th className="py-3 pr-4 whitespace-nowrap">Balance</th>
                  <th className="py-3 pr-4 whitespace-nowrap">Status</th>
                  <th className="py-3 pr-4 whitespace-nowrap">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((r, i) => (
                  <tr key={i} className="text-neutral-800">
                    <td className="py-3 pl-3 pr-4 whitespace-nowrap">{r.date}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">${r.totalAdvance?.toLocaleString()}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">{r.type}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">${r.repaidAdvance?.toLocaleString()}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">${r.advanceBalance?.toLocaleString()}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <StatusPill label={r.status} />
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">{r.source}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-neutral-500">
                      No advances found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default LabelArtistAdvance;
