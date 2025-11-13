import { ChartCard } from '@/components/dashboard/ChartCard';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { BRAND } from '@/lib/brand';
import { Calendar, Download as ExportIcon, Plus } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import AddExpensesModal, { NewExpensesPayload } from './AddExpensesModal';

const trend = [
  { label: 'Jan', value: 1400 },
  { label: 'Feb', value: 1300 },
  { label: 'Mar', value: 1500 },
  { label: 'Apr', value: 4000 },
  { label: 'May', value: 2600 },
  { label: 'Jun', value: 3000 },
  { label: 'Jul', value: 4200 },
  { label: 'Aug', value: 3600 },
  { label: 'Sep', value: 3300 },
  { label: 'Oct', value: 2600 },
  { label: 'Nov', value: 4500 },
  { label: 'Dec', value: 5200 },
];

type Row = {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  receipt?: string;
};

const rows: Row[] = [
  {
    id: 'EXP-001',
    date: '03-01-2024',
    category: 'Marketing',
    amount: 1500,
    description: 'Social media advertising campaign',
    receipt: 'receipt_001.pdf',
  },
  {
    id: 'EXP-002',
    date: '15-01-2024',
    category: 'Equipment',
    amount: 3200,
    description: 'Studio microphone and audio interface',
    receipt: 'receipt_002.pdf',
  },
  {
    id: 'EXP-003',
    date: '22-01-2024',
    category: 'Travel',
    amount: 850,
    description: 'Flight tickets for performance',
    receipt: 'receipt_003.pdf',
  },
  {
    id: 'EXP-004',
    date: '05-02-2024',
    category: 'Production',
    amount: 2400,
    description: 'Music video production costs',
    receipt: 'receipt_004.pdf',
  },
  {
    id: 'EXP-005',
    date: '12-02-2024',
    category: 'Marketing',
    amount: 980,
    description: 'Playlist promotion services',
  },
];

const SoloArtistExpenses = () => {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [openAdd, setOpenAdd] = useState(false);
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (category === 'All Categories' || r.category === category) &&
          (q === '' ||
            r.id.toLowerCase().includes(q.toLowerCase()) ||
            r.category.toLowerCase().includes(q.toLowerCase()) ||
            r.description.toLowerCase().includes(q.toLowerCase()))
      ),
    [q, category]
  );
  return (
    <div>
      <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center justify-between ">
        <div>
          <h1 className="text-2xl font-medium text-[#3C3C3C]">
            Diamond Platnumz Expenses{' '}
          </h1>
          <p className="text-base text-[#777777]">
            You are now on the page to manage Record Label artists.{' '}
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
            <Plus className="h-4 w-4" /> Add Expenses
          </Button>
        </div>
      </div>
      <div className="mt-10">
        <ChartCard
          title="Expenses Trend"
          variant="line"
          data={trend}
          xKey="label"
          yKey="value"
          color={BRAND.purple}
          bandFill="#F4F4F4"
          lineType="monotone"
        />
      </div>
      <Card className=" flex-1 mt-8">
        <CardBody className="p-0!">
          <div className="flex flex-wrap items-center justify-between p-3 gap-3">
            <div className="text-sm font-semibold text-[#3C3C3C]">
              All expenses{' '}
            </div>
            <div className="lg:ml-auto flex lg:items-center lg:flex-row flex-col items-start gap-2">
              <input
                placeholder="Search expenses"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-10 w-60 rounded-xl border border-neutral-200 bg-[#F4F4F4] px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-100"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm"
            >
              <option>All Categories</option>
              <option>Marketing</option>
              <option>Equipment</option>
              <option>Travel</option>
              <option>Production</option>
            </select>
          </div>

          <div className="  overflow-x-auto">
            <table className="w-full text-base">
              <thead className=" text-left text-neutral-500 bg-[#F4F4F4]">
                <tr>
                  <th className="py-3 pl-3 pr-4 whitespace-nowrap">ID</th>
                  <th className="py-3 pr-4 whitespace-nowrap">Date</th>
                  <th className="py-3 pr-4 whitespace-nowrap">Category</th>
                  <th className="py-3 pr-4 whitespace-nowrap">Amount</th>
                  <th className="py-3 pr-4 whitespace-nowrap">Description</th>
                  <th className="py-3 pr-3 whitespace-nowrap">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((r, i) => (
                  <tr key={i} className="text-neutral-800">
                    <td className="py-3 pl-3 pr-4 whitespace-nowrap">{r.id}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">{r.date}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {r.category}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      ${r.amount.toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {r.description}
                    </td>
                    <td className="py-3 pr-3 bg whitespace-nowrap">
                      {r.receipt || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
      <AddExpensesModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSubmit={async (payload: NewExpensesPayload) => {
          // TODO: call your API
          console.log('create advance payload', payload);
        }}
      />
    </div>
  );
};

export default SoloArtistExpenses;
