import { ChartCard } from '@/components/dashboard/ChartCard';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { BRAND } from '@/lib/brand';
import { Calendar, Plus, ChevronDown } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import AddExpensesModal, { NewExpensesPayload } from './AddExpensesModal';
import { useExpenses } from '@/hooks/useExpenses';
import { uploadFile } from '@/lib/utils/upload';
import { Menu } from '@/components/ui/Menu';

const CategoryDisplay: Record<string, string> = {
  marketting: 'Marketing',
  production: 'Production',
  personal: 'Personal',
};

const SoloArtistExpenses = () => {
  const { expenses, trend, createExpense } = useExpenses();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [openAdd, setOpenAdd] = useState(false);
  
  const trendData = useMemo(() => {
    if (!trend || trend.length === 0) return [{ label: 'No data', value: 0 }];
    return trend.map((item) => ({
      label: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: item.amount,
    }));
  }, [trend]);
  
  const filtered = useMemo(
    () =>
      (expenses || []).filter(
        (r) =>
          (category === 'All Categories' || r.category === category) &&
          (q === '' ||
            r._id.toLowerCase().includes(q.toLowerCase()) ||
            r.category.toLowerCase().includes(q.toLowerCase()) ||
            r.description.toLowerCase().includes(q.toLowerCase()))
      ),
    [q, category, expenses]
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
        <Menu
                    trigger={
                      <Button
                        variant="outline"
                        className="w-full bg-[#EAEAEA] rounded-2xl lg:w-auto gap-2"
                      >
                        <svg
                          width="15"
                          height="17"
                          viewBox="0 0 15 17"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M7.98833 0C8.37963 9.56093e-05 8.75841 0.137862 9.05833 0.389167L9.16667 0.488333L12.845 4.16667C13.1217 4.44335 13.2922 4.80857 13.3267 5.19833L13.3333 5.345V8.33333H11.6667V6.66667H7.91667C7.60593 6.66665 7.30634 6.5509 7.07632 6.34198C6.84629 6.13307 6.70233 5.84597 6.6725 5.53667L6.66667 5.41667V1.66667H1.66667V15H6.66667V16.6667H1.66667C1.24619 16.6668 0.841195 16.508 0.532877 16.2221C0.224559 15.9362 0.0357029 15.5443 0.00416685 15.125L8.35567e-08 15V1.66667C-0.000132983 1.24619 0.158672 0.841194 0.444581 0.532877C0.73049 0.224559 1.12237 0.0357028 1.54167 0.00416676L1.66667 0H7.98833ZM12.2558 10.3875L14.6125 12.7442C14.7687 12.9004 14.8565 13.1124 14.8565 13.3333C14.8565 13.5543 14.7687 13.7662 14.6125 13.9225L12.2558 16.2792C12.179 16.3588 12.087 16.4222 11.9853 16.4659C11.8837 16.5096 11.7743 16.5326 11.6637 16.5335C11.553 16.5345 11.4433 16.5134 11.3409 16.4715C11.2385 16.4296 11.1454 16.3677 11.0672 16.2895C10.9889 16.2113 10.927 16.1182 10.8851 16.0158C10.8432 15.9134 10.8222 15.8036 10.8231 15.693C10.8241 15.5823 10.8471 15.473 10.8907 15.3713C10.9344 15.2697 10.9979 15.1777 11.0775 15.1008L12.0117 14.1667H8.33333C8.11232 14.1667 7.90036 14.0789 7.74408 13.9226C7.5878 13.7663 7.5 13.5543 7.5 13.3333C7.5 13.1123 7.5878 12.9004 7.74408 12.7441C7.90036 12.5878 8.11232 12.5 8.33333 12.5H12.0117L11.0775 11.5658C10.9211 11.4096 10.8332 11.1976 10.8332 10.9765C10.8331 10.7555 10.9208 10.5435 11.0771 10.3871C11.2333 10.2307 11.4453 10.1428 11.6664 10.1427C11.8874 10.1427 12.0995 10.2304 12.2558 10.3867V10.3875ZM8.33333 2.01167V5H11.3217L8.33333 2.01167Z"
                            fill="#2D2D2D"
                          />
                        </svg>
                        Export <ChevronDown className="h-4 w-4" />
                      </Button>
                    }
                    items={[
                      { label: "Export analytics", onClick: () => {} },
                      { label: "Export data", onClick: () => {} },
                    ]}
                  />

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
          data={trendData}
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
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 appearance-none rounded-xl border border-neutral-200 bg-white pl-3 pr-8 text-sm outline-none focus:ring-2 focus:ring-neutral-100"
              >
                <option>All Categories</option>
                <option value="marketting">Marketing</option>
                <option value="production">Production</option>
                <option value="personal">Personal</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black" />
            </div>
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
                  <tr key={r.ref_id || r._id || i} className="text-neutral-800">
                    <td className="py-3 pl-3 pr-4 whitespace-nowrap max-w-[150px] truncate">{r.ref_id}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">{new Date(r.expense_date || r.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {CategoryDisplay[r.category] || r.category}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {r.amount ? `$${r.amount.toLocaleString()}` : 'N/A'}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {r.description || 'N/A'}
                    </td>
                    <td className="py-3 pr-3 bg whitespace-nowrap">
                      {r.receipt_url ? (
                        <a href={r.receipt_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View Receipt
                        </a>
                      ) : 'N/A'}
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
          try {
            let receiptUrl = '';
            if (payload.proofs && payload.proofs.length > 0) {
              receiptUrl = await uploadFile(payload.proofs[0], 'expense');
            }

            await createExpense({
              expense_date: payload.expense_date,
              category: payload.category,
              currency: payload.currency,
              amount: payload.amount,
              description: payload.description,
              receipt_url: receiptUrl,
            });
            setOpenAdd(false);
          } catch (error) {
            console.error('Create expense failed', error);
          }
        }}
      />
    </div>
  );
};

export default SoloArtistExpenses;
