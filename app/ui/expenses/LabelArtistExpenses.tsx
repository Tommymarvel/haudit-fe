'use client';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar, ChevronDown } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useExpenses } from '@/hooks/useExpenses';

const CategoryDisplay: Record<string, string> = {
  marketting: 'Marketing',
  production: 'Production',
  personal: 'Personal',
};

const LabelArtistExpenses = () => {
  const { expenses } = useExpenses();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('All Categories');

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
      <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-[#3C3C3C]">My Expenses</h1>
          <p className="text-base text-[#777777]">
            View expenses recorded by your label.
          </p>
        </div>
        <div className="w-full lg:w-fit flex gap-2">
          <Button variant="outline" className="w-full bg-[#EAEAEA] rounded-2xl lg:w-auto">
            <Calendar className="h-4 w-4" /> Year
          </Button>
        </div>
      </div>

      <Card className="flex-1 mt-8">
        <CardBody className="p-0!">
          <div className="flex flex-wrap items-center justify-between p-3 gap-3">
            <div className="text-sm font-semibold text-[#3C3C3C]">All expenses</div>
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

          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead className="text-left text-neutral-500 bg-[#F4F4F4]">
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
                    <td className="py-3 pl-3 pr-4 whitespace-nowrap max-w-[150px] truncate">
                      {r.ref_id}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {new Date(r.expense_date || r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {CategoryDisplay[r.category] || r.category}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {r.amount ? `$${r.amount.toLocaleString()}` : 'N/A'}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">{r.description || 'N/A'}</td>
                    <td className="py-3 pr-3 whitespace-nowrap">
                      {r.receipt_url ? (
                        <a
                          href={r.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View Receipt
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default LabelArtistExpenses;
