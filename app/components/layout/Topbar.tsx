import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import YearFilterCalendar from '../ui/YearFilterCalendar';

type TopbarProps = {
  /** Controlled selected year. When provided with onYearChange, the parent owns the filter. */
  year?: number | null;
  onYearChange?: (year: number | null) => void;
};

export default function Topbar({ year, onYearChange }: TopbarProps = {}) {
  const { user } = useAuth();
  const [internalYear, setInternalYear] = useState<number | null>(new Date().getFullYear());
  const isControlled = onYearChange !== undefined;
  const selectedYear = isControlled ? year ?? null : internalYear;
  const handleYearChange = isControlled ? onYearChange! : setInternalYear;
  return (
    <div className="flex items-center justify-between border-neutral-200  ">
      <div>
        <h1 className="text-3xl font-medium text-[#3C3C3C]">
          Welcome back, {user ? user.first_name : 'User'}
        </h1>
        <p className=" text-[#777777]">
          Your financial records and revenue in one place.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <YearFilterCalendar
          value={selectedYear}
          onChange={handleYearChange}
          showYear
          align="right"
          buttonClassName="inline-flex items-center gap-2 rounded-2xl bg-[#EAEAEA] px-3 py-2 text-sm font-medium text-neutral-800"
        />
      </div>
    </div>
  );
}
