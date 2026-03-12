'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { ChevronDown, MessageSquare, MoreVertical, RefreshCw, FileText, ArrowUpDown, Calendar } from 'lucide-react';
import { Menu } from '@/components/ui/Menu';
import Image from 'next/image';

const RecordLabelAdvance = () => {
  const [tab, setTab] = useState<'request' | 'analytics'>('request');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All status');

  // Mock data for the table exactly as per Figma 5407:10078
  const topAdvanceData = [
    { id: 'TRK-2025-0045', date: '03-Jan-2024', amount: '$500', type: 'Personal', status: 'Pending', artist: 'Diamond Platnumz' },
    { id: 'TRK-2025-0045', date: '03-Jan-2024', amount: '$500', type: 'Marketing', status: 'Approved', artist: 'Sho Madjozi' },
    { id: 'TRK-2025-0045', date: '03-Jan-2024', amount: '$500', type: 'Marketing', status: 'Pending', artist: 'Sarkodie' },
    { id: 'TRK-2025-0045', date: '03-Jan-2024', amount: '$500', type: 'Personal', status: 'Rejected', artist: 'Omah Lay' },
    { id: 'TRK-2025-0045', date: '03-Jan-2024', amount: '$500', type: 'Marketing', status: 'Approved', artist: 'Master KG' },
    { id: 'TRK-2025-0045', date: '03-Jan-2024', amount: '$500', type: 'Personal', status: 'Approved', artist: 'Ayra Starr' },
    { id: 'TRK-2025-0046', date: '04-Jan-2024', amount: '$750', type: 'Marketing', status: 'Pending', artist: 'Burna Boy' },
    { id: 'TRK-2025-0047', date: '04-Jan-2024', amount: '$600', type: 'Personal', status: 'Approved', artist: 'Tiwa Savage' },
    { id: 'TRK-2025-0048', date: '05-Jan-2024', amount: '$800', type: 'Marketing', status: 'Rejected', artist: 'Davido' },
    { id: 'TRK-2025-0049', date: '05-Jan-2024', amount: '$300', type: 'Personal', status: 'Approved', artist: 'Wizkid' },
    { id: 'TRK-2025-0050', date: '06-Jan-2024', amount: '$900', type: 'Marketing', status: 'Pending', artist: 'Fireboy DML' },
  ];

  const filtered = topAdvanceData.filter(
    (r) =>
      (status === 'All status' || r.status === status) &&
      (q === '' || r.artist.toLowerCase().includes(q.toLowerCase()))
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

          <Button
            variant="primary"
            className="col-span-2 w-full rounded-2xl lg:col-span-1 lg:w-auto gap-2"
            style={{ backgroundColor: '#7B00D4' }} // BRAND.purple
          >
            <svg width="15" height="17" viewBox="0 0 15 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M7.98833 0C8.37963 9.56093e-05 8.75841 0.137862 9.05833 0.389167L9.16667 0.488333L12.845 4.16667C13.1217 4.44335 13.2922 4.80857 13.3267 5.19833L13.3333 5.345V8.33333H11.6667V6.66667H7.91667C7.60593 6.66665 7.30634 6.5509 7.07632 6.34198C6.84629 6.13307 6.70233 5.84597 6.6725 5.53667L6.66667 5.41667V1.66667H1.66667V15H6.66667V16.6667H1.66667C1.24619 16.6668 0.841195 16.508 0.532877 16.2221C0.224559 15.9362 0.0357029 15.5443 0.00416685 15.125L8.35567e-08 15V1.66667C-0.000132983 1.24619 0.158672 0.841194 0.444581 0.532877C0.73049 0.224559 1.12237 0.0357028 1.54167 0.00416676L1.66667 0H7.98833ZM12.2558 10.3875L14.6125 12.7442C14.7687 12.9004 14.8565 13.1124 14.8565 13.3333C14.8565 13.5543 14.7687 13.7662 14.6125 13.9225L12.2558 16.2792C12.179 16.3588 12.087 16.4222 11.9853 16.4659C11.8837 16.5096 11.7743 16.5326 11.6637 16.5335C11.553 16.5345 11.4433 16.5134 11.3409 16.4715C11.2385 16.4296 11.1454 16.3677 11.0672 16.2895C10.9889 16.2113 10.927 16.1182 10.8851 16.0158C10.8432 15.9134 10.8222 15.8036 10.8231 15.693C10.8241 15.5823 10.8471 15.473 10.8907 15.3713C10.9344 15.2697 10.9979 15.1777 11.0775 15.1008L12.0117 14.1667H8.33333C8.11232 14.1667 7.90036 14.0789 7.74408 13.9226C7.5878 13.7663 7.5 13.5543 7.5 13.3333C7.5 13.1123 7.5878 12.9004 7.74408 12.7441C7.90036 12.5878 8.11232 12.5 8.33333 12.5H12.0117L11.0775 11.5658C10.9211 11.4096 10.8332 11.1976 10.8332 10.9765C10.8331 10.7555 10.9208 10.5435 11.0771 10.3871C11.2333 10.2307 11.4453 10.1428 11.6664 10.1427C11.8874 10.1427 12.0995 10.2304 12.2558 10.3867V10.3875ZM8.33333 2.01167V5H11.3217L8.33333 2.01167Z" fill="#FFF" />
            </svg>
            Export
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-8 flex flex-nowrap lg:grid lg:grid-cols-4 gap-6 overflow-x-auto lg:overflow-x-visible pb-2">
        {/* Total Request */}
        <div className="min-w-[280px] lg:min-w-0 flex-shrink-0 bg-white rounded-3xl border border-neutral-200 p-6 flex flex-col justify-between h-[120px]">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-4xl font-semibold text-neutral-900">20</div>
              <div className="text-sm text-neutral-500 mt-1">Total request</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-2">
              <ArrowUpDown className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Pending Request */}
        <div className="min-w-[280px] lg:min-w-0 flex-shrink-0 bg-white rounded-3xl border border-neutral-200 p-6 flex flex-col justify-between h-[120px]">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-4xl font-semibold text-neutral-900">10</div>
              <div className="text-sm text-neutral-500 mt-1">Pending request</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-2">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Given Advance */}
        <div className="min-w-[280px] lg:min-w-0 flex-shrink-0 bg-white rounded-3xl border border-neutral-200 p-6 flex flex-col justify-between h-[120px]">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-4xl font-semibold text-neutral-900">$20,400</div>
              <div className="text-sm text-neutral-500 mt-1">Given Advance</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            </div>
          </div>
        </div>

        {/* Repaid Advance */}
        <div className="min-w-[280px] lg:min-w-0 flex-shrink-0 bg-white rounded-3xl border border-neutral-200 p-6 flex flex-col justify-between h-[120px]">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-4xl font-semibold text-neutral-900">$12,400</div>
              <div className="text-sm text-neutral-500 mt-1">Repaid Advance</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-2">
              <RefreshCw className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 border-b border-neutral-200">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setTab('request')}
            className={`px-1 py-4 text-sm flex items-center gap-2 ${tab === 'request'
                ? 'text-[#7B00D4] font-medium border-b-2 border-[#7B00D4]'
                : 'text-neutral-500 hover:text-neutral-700'
              }`}
          >
            Advance request {tab === 'request' && <div className="w-2 h-2 rounded-full bg-red-500" />}
          </button>
          <button
            onClick={() => setTab('analytics')}
            className={`px-1 py-4 text-sm flex items-center gap-2 ${tab === 'analytics'
                ? 'text-[#7B00D4] font-medium border-b-2 border-[#7B00D4]'
                : 'text-neutral-500 hover:text-neutral-700'
              }`}
          >
            Analytics
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
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="appearance-none flex items-center gap-2 px-10 pl-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-700 hover:bg-neutral-50"
                  style={{ minWidth: "120px" }}
                >
                  <option>All status</option>
                  <option>Approved</option>
                  <option>Pending</option>
                  <option>Rejected</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
              </div>
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
                {filtered.map((advance, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/50">
                    <td className="px-6 py-4 text-neutral-900 font-medium">{advance.id}</td>
                    <td className="px-6 py-4 text-neutral-500">{advance.date}</td>
                    <td className="px-6 py-4 text-neutral-900 font-medium">{advance.amount}</td>
                    <td className="px-6 py-4 text-neutral-600">{advance.type}</td>
                    <td className="px-6 py-4">
                      <StatusPill label={advance.status as any} />
                    </td>
                    <td className="px-6 py-4 text-neutral-600">{advance.artist}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 text-neutral-400 justify-end">
                        <button className="hover:text-[#7B00D4]"><MessageSquare className="h-4 w-4" /></button>
                        <button className="hover:text-[#7B00D4]"><MoreVertical className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordLabelAdvance;
