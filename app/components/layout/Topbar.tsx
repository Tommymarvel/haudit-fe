import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import YearFilterCalendar from '../ui/YearFilterCalendar';

export default function Topbar() {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  return (
    <div className="flex items-center justify-between border-neutral-200  ">
      <div>
        <h1 className="text-3xl font-medium text-[#3C3C3C]">
          Welcome back, {user ? user.first_name : 'User'}
        </h1>
        <p className=" text-[#777777]">
          Track, manage and forecast your customers and orders.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <YearFilterCalendar
          value={selectedYear}
          onChange={setSelectedYear}
          showYear
          align="right"
          buttonClassName="inline-flex items-center gap-2 rounded-2xl bg-[#EAEAEA] px-3 py-2 text-sm font-medium text-neutral-800"
        />
      </div>
    </div>
  );
}
