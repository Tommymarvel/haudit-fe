import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { StatCard } from '@/components/dashboard/StatCard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { Calendar, Download as ExportIcon, Plus } from 'lucide-react';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import AdvanceRowActions from './AdvanceRowActions';
import AdvanceDetailsModal, { AdvanceDetails } from './AdvanceDetailsModal';
import RepaymentModal from './RepaymentModal';
import AddAdvanceModal, { NewAdvancePayload } from './AddAdvanceModal';
import { BRAND } from '@/lib/brand';

type Row = {
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

const rows: Row[] = [
  {
    date: '03-01-2024',
    amount: 500,
    type: 'Personal',
    status: 'Repaid',
    source: 'Chocolate City',
    totalAdvance: 5000,
    repaidAdvance: 5000,
    advanceBalance: 0,
    phone: '+234 801 234 5678',
    email: 'contact@chocolatecity.com',
  },
  {
    date: '03-01-2024',
    amount: 500,
    type: 'Marketing',
    status: 'Outstanding',
    source: 'Mavin Records',
    totalAdvance: 8000,
    repaidAdvance: 3000,
    advanceBalance: 5000,
    phone: '+234 802 345 6789',
    email: 'info@mavinrecords.com',
  },
  {
    date: '03-01-2024',
    amount: 500,
    type: 'Marketing',
    status: 'Outstanding',
    source: 'Chocolate City',
    totalAdvance: 5000,
    repaidAdvance: 5000,
    advanceBalance: 0,
    phone: '+234 801 234 5678',
    email: 'contact@chocolatecity.com',
  },
  {
    date: '04-02-2024',
    amount: 800,
    type: 'Personal',
    status: 'Pending',
    source: 'YBNL Nation',
    totalAdvance: 10000,
    repaidAdvance: 2000,
    advanceBalance: 8000,
    phone: '+234 803 456 7890',
    email: 'admin@ybnlnation.com',
  },
];

const marketingTrend = [
  { label: 'Jan', value: 800 },
  { label: 'Feb', value: 1200 },
  { label: 'Mar', value: 3500 },
  { label: 'Apr', value: 3000 },
  { label: 'May', value: 3300 },
  { label: 'Jun', value: 4100 },
  { label: 'Jul', value: 2100 },
  { label: 'Aug', value: 2200 },
  { label: 'Sep', value: 2600 },
  { label: 'Oct', value: 2400 },
  { label: 'Nov', value: 4500 },
  { label: 'Dec', value: 5000 },
];
const personalTrend = marketingTrend.map((d, i) => ({
  label: d.label,
  value: Math.max(400, d.value - (i % 5) * 800),
}));

const donutData = [
  { name: 'Marketing', value: 1500, color: BRAND.purple },
  { name: 'Personal', value: 2000, color: BRAND.green },
];

const SoloArtistAdvance = () => {
  const [tab, setTab] = useState<'analytics' | 'source'>('analytics');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [openDetails, setOpenDetails] = useState(false);
  const [detailsData, setDetailsData] = useState<AdvanceDetails | null>(null);
  const [openRepay, setOpenRepay] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (status === 'All' || r.status === status) &&
          (q === '' || r.source.toLowerCase().includes(q.toLowerCase()))
      ),
    [q, status]
  );

  const openDetailsFor = (r: Row) => {
    setDetailsData({
      id: 'TRK-2025-0045',
      date: r.date,
      status: r.status,
      amount: r.amount,
      repaidAmount: r.status === 'Repaid' ? r.amount : Math.min(500, r.amount),
      type: r.type,
      source: r.source,
      phone: '+234 706 509 1692',
      email: 'chocolatecity@yahoo.com',
      proofs: ['Transaction Receipt for Alex...', 'Transaction 01234...'],
      purpose:
        'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout...',
      history: [
        {
          date: r.date,
          repaidAmount: 500,
          balanceAmount: 0,
          proofs: ['Transaction...', 'Transaction...'],
        },
      ],
    });
    setOpenDetails(true);
  };

  return (
    <div>
      {/* Header row */}
      <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center justify-between ">
        <div>
          <h1 className="text-2xl font-medium text-[#3C3C3C]">
            Welcome to Advance-O-Meter Diamond
          </h1>
          <p className="text-base text-[#777777]">
            Track and get more info on your advance request
          </p>
        </div>
        <div className="w-full lg:w-fit grid grid-cols-2 gap-2 lg:flex">
          {/* Year — 1/2 width on mobile */}
          <Button
            variant="outline"
            className="w-full  bg-[#EAEAEA] rounded-2xl lg:w-auto"
          >
            <Calendar className="h-4 w-4" /> Year
          </Button>

          {/* Export — other 1/2 on mobile */}
          <Button
            variant="outline"
            className="w-full bg-[#EAEAEA] rounded-2xl lg:w-auto"
          >
            <ExportIcon className="h-4 w-4" /> Export
          </Button>

          {/* Add Advance — full width on mobile (spans 2 cols), normal on lg */}
          <Button
            variant="primary"
            className="col-span-2 w-full rounded-2xl lg:col-span-1 lg:w-auto"
            style={{ backgroundColor: BRAND.purple }}
            onClick={() => setOpenAdd(true)}
          >
            <Plus className="h-4 w-4" /> Add Advance
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total advance source"
          value={20}
          icon={
            <Image
              src="/svgs/advance.svg"
              width={48}
              height={48}
              alt="haudit"
            />
          }
        />
        <StatCard
          title="Total Advance"
          value={'$15,000'}
          icon={
            <Image
              src="/svgs/moneybag.svg"
              width={48}
              height={48}
              alt="haudit"
            />
          }
        />
        <StatCard
          title="Repaid Advance"
          value={'$2,400'}
          icon={
            <Image src="/svgs/repaid.svg" width={48} height={48} alt="haudit" />
          }
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

      {tab === 'analytics' ? (
        <>
          {/* Trends + donut */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="lg:col-span-1">
              <ChartCard
                title="Marketing advance trend"
                variant="line"
                data={marketingTrend}
                xKey="label"
                yKey="value"
                color={BRAND.purple}
                bandFill="#F4F4F4"
              />
            </div>
            <div className="lg:col-span-1">
              <ChartCard
                title="Personal advance trend"
                variant="line"
                data={personalTrend}
                xKey="label"
                yKey="value"
                color={BRAND.green}
                bandFill="#F4F4F4"
              />
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-4 mt-6">
            {' '}
            {/* Table */}
            <Card className="lg:w-[70%] flex-1">
              <CardBody className="p-0!">
                <div className="flex flex-wrap items-center p-3 gap-3">
                  <div className="text-sm font-semibold text-[#3C3C3C]">
                    Advance request
                  </div>
                  <div className="lg:ml-auto flex lg:items-center lg:flex-row flex-col items-start gap-2">
                    <input
                      placeholder="Search advance"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      className="h-10 w-60 rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-100"
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

                <div className=" overflow-x-auto">
                  <table className="w-full text-base">
                    <thead className=" text-left text-neutral-500 bg-[#F4F4F4]">
                      {' '}
                      <tr>
                        <th className="py-3 pl-3 pr-4 whitespace-nowrap">
                          Date
                        </th>
                        <th className="py-3 pr-4 whitespace-nowrap">Amount</th>
                        <th className="py-3 pr-4 whitespace-nowrap">
                          Advance type
                        </th>
                        <th className="py-3 pr-4 whitespace-nowrap">Status</th>
                        <th className="py-3 pr-4 whitespace-nowrap">
                          Advance source
                        </th>
                        <th className="py-3 pr-4 whitespace-nowrap"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {filtered.map((r, i) => (
                        <tr key={i} className="text-neutral-800">
                          <td className="py-3 pl-3 pr-4 whitespace-nowrap">
                            {r.date}
                          </td>
                          <td className="py-3 pr-4 whitespace-nowrap">
                            ${r.amount.toLocaleString()}
                          </td>
                          <td className="py-3 pr-4 whitespace-nowrap">
                            {r.type}
                          </td>
                          <td className="py-3 pr-4 whitespace-nowrap">
                            <StatusPill label={r.status} />
                          </td>
                          <td className="py-3 pr-4 whitespace-nowrap">
                            {r.source}
                          </td>
                          <td className="py-3 pr-4 text-right whitespace-nowrap">
                            <AdvanceRowActions
                              onRepay={() => setOpenRepay(true)}
                              onViewDetails={() => openDetailsFor(r)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
            <div className="lg:w-[30%] w-full">
              <ChartCard
                title="Advance type"
                variant="donut"
                data={donutData}
                donutInnerText={'Total\nAdvance'}
                bandFill="#F4F4F4"
              />
            </div>
          </div>
        </>
      ) : (
        // “Advance source” tab placeholder
        <Card className=" flex-1 mt-8">
          <CardBody className="p-0!">
            <div className="flex flex-wrap items-center justify-between p-3 gap-3">
              <div className="text-sm font-semibold text-[#3C3C3C]">
                All advance source{' '}
              </div>
              <div className="lg:ml-auto flex lg:items-center lg:flex-row flex-col items-start gap-2">
                <input
                  placeholder="Search advance source"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="h-10 w-60 rounded-xl border border-neutral-200 bg-[#F4F4F4] px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-100"
                />
              </div>
            </div>

            <div className="  overflow-x-auto">
              <table className="w-full text-base">
                <thead className=" text-left text-neutral-500 bg-[#F4F4F4]">
                  <tr>
                    <th className="py-3 pl-3 pr-4 whitespace-nowrap">
                      Advance source
                    </th>
                    <th className="py-3 pr-4 whitespace-nowrap">
                      Total advance
                    </th>
                    <th className="py-3 pr-4 whitespace-nowrap">
                      Repaid advance
                    </th>
                    <th className="py-3 pr-4 whitespace-nowrap">
                      Advance balance
                    </th>
                    <th className="py-3 pr-4 whitespace-nowrap">
                      Phone number
                    </th>
                    <th className="py-3 pr-3 whitespace-nowrap">
                      Email address
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filtered.map((r, i) => (
                    <tr key={i} className="text-neutral-800">
                      <td className="py-3 pl-3 pr-4 whitespace-nowrap">
                        {r.source}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        ${r.totalAdvance?.toLocaleString() || '0'}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        ${r.repaidAdvance?.toLocaleString() || '0'}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        ${r.advanceBalance?.toLocaleString() || '0'}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {r.phone || 'N/A'}
                      </td>
                      <td className="py-3 pr-3 whitespace-nowrap">
                        {r.email || 'N/A'}
                      </td>
                    </tr>
                  ))}
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
      <RepaymentModal
        open={openRepay}
        onClose={() => setOpenRepay(false)}
        onSubmit={async ({ amount, files }) => {
          // TODO: send to API
          console.log('repayment payload', amount, files);
          // await fetch('/api/advance/repay', { method:'POST', body:formData })
        }}
      />
      <AddAdvanceModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSubmit={async (payload: NewAdvancePayload) => {
          // TODO: call your API
          console.log('create advance payload', payload);
        }}
      />
    </div>
  );
};

export default SoloArtistAdvance;
