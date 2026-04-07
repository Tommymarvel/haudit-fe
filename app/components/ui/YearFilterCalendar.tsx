"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

type YearFilterCalendarProps = {
  value?: number | null;
  onChange?: (year: number | null) => void;
  label?: string;
  showYear?: boolean;
  align?: "left" | "right" | "auto";
  buttonClassName?: string;
};

type CalendarCell = {
  day: number;
  monthOffset: -1 | 0 | 1;
  date: Date;
};

const WEEK_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function getMonthName(date: Date) {
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function buildCalendarCells(viewDate: Date): CalendarCell[] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: CalendarCell[] = [];

  for (let i = startWeekday - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    cells.push({ day, monthOffset: -1, date: new Date(year, month - 1, day) });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, monthOffset: 0, date: new Date(year, month, day) });
  }

  let nextDay = 1;
  while (cells.length < 42) {
    const day = nextDay++;
    cells.push({ day, monthOffset: 1, date: new Date(year, month + 1, day) });
  }

  return cells;
}

export default function YearFilterCalendar({
  value,
  onChange,
  label = "Year",
  showYear = true,
  align = "auto",
  buttonClassName = "",
}: YearFilterCalendarProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const initialYear = value ?? today.getFullYear();
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(initialYear, today.getMonth(), 1));
  const [startDate, setStartDate] = useState<Date | null>(
    typeof value === "number" ? new Date(value, 0, 1) : null,
  );
  const [endDate, setEndDate] = useState<Date | null>(
    typeof value === "number" ? new Date(value, 11, 31) : null,
  );
  const [draftStartDate, setDraftStartDate] = useState<Date | null>(
    typeof value === "number" ? new Date(value, 0, 1) : null,
  );
  const [draftEndDate, setDraftEndDate] = useState<Date | null>(
    typeof value === "number" ? new Date(value, 11, 31) : null,
  );
  const [resolvedAlign, setResolvedAlign] = useState<"left" | "right">("right");
  const rootRef = useRef<HTMLDivElement | null>(null);

  const normalizeDate = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const isSameDay = (a: Date | null, b: Date | null) =>
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const formatDate = (date: Date | null) =>
    date
      ? date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "";

  useEffect(() => {
    if (typeof value === "number") {
      const nextStart = new Date(value, 0, 1);
      const nextEnd = new Date(value, 11, 31);
      setViewDate((prev) => new Date(value, prev.getMonth(), 1));
      setStartDate(nextStart);
      setEndDate(nextEnd);
      setDraftStartDate(nextStart);
      setDraftEndDate(nextEnd);
      return;
    }

    const nextStart = new Date(currentYear, 0, 1);
    const nextEnd = new Date(currentYear, 11, 31);
    setStartDate(nextStart);
    setEndDate(nextEnd);
    setDraftStartDate(nextStart);
    setDraftEndDate(nextEnd);
    setViewDate(new Date(currentYear, today.getMonth(), 1));
  }, [currentYear, value]);

  useEffect(() => {
    if (!isOpen) return;

    if (align !== "auto") {
      setResolvedAlign(align);
      return;
    }

    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const viewportWidth = window.innerWidth;
    const popoverWidth = Math.min(360, viewportWidth - 16);
    const wouldOverflowRight = rect.left + popoverWidth > viewportWidth - 8;
    setResolvedAlign(wouldOverflowRight ? "right" : "left");
  }, [align, isOpen]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const cells = useMemo(() => buildCalendarCells(viewDate), [viewDate]);
  const selectedYear =
    typeof value === "number"
      ? value
      : endDate?.getFullYear() ?? currentYear;

  const selectFullYear = (year: number) => {
    setDraftStartDate(new Date(year, 0, 1));
    setDraftEndDate(new Date(year, 11, 31));
  };

  const handleDayClick = (clickedDate: Date) => {
    const normalized = normalizeDate(clickedDate);

    if (!draftStartDate || (draftStartDate && draftEndDate)) {
      setDraftStartDate(normalized);
      setDraftEndDate(null);
      return;
    }

    if (normalized < draftStartDate) {
      setDraftEndDate(draftStartDate);
      setDraftStartDate(normalized);
      return;
    }

    setDraftEndDate(normalized);
  };

  const inDraftRange = (date: Date) => {
    if (!draftStartDate || !draftEndDate) return false;
    const t = normalizeDate(date).getTime();
    return t >= draftStartDate.getTime() && t <= draftEndDate.getTime();
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => {
          setDraftStartDate(startDate);
          setDraftEndDate(endDate);
          setIsOpen((prev) => !prev);
        }}
        className={`inline-flex items-center gap-2 whitespace-nowrap rounded-2xl bg-[#EAEAEA] px-3 py-2 text-sm font-medium text-neutral-800 ${buttonClassName}`}
      >
        <Calendar className="h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap">{label}{showYear ? ` ${selectedYear}` : ""}</span>
      </button>

      {isOpen && (
        <div
          className={`absolute top-full z-50 mt-2 w-[calc(100vw-1rem)] max-w-[360px] rounded-2xl border border-[#2E3440] bg-[#171A20] p-4 text-white shadow-2xl ${
            resolvedAlign === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              className="rounded-md p-1 text-neutral-300 hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-2xl font-semibold tracking-tight">{getMonthName(viewDate)}</div>
            <button
              type="button"
              onClick={() => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              className="rounded-md p-1 text-neutral-300 hover:bg-white/10"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => selectFullYear(viewDate.getFullYear())}
              className="rounded-lg border border-[#4B5563] px-2 py-1.5 text-xs text-neutral-200 hover:bg-white/10"
            >
              Full year {viewDate.getFullYear()}
            </button>
          </div>

          <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="rounded-xl border border-[#4B5563] px-3 py-2 text-sm text-[#9CA3AF] truncate">
              {draftStartDate ? formatDate(draftStartDate) : "Start date"}
            </div>
            <div className="text-center text-lg text-[#9CA3AF]">-</div>
            <div className="rounded-xl border border-[#4B5563] px-3 py-2 text-sm text-[#9CA3AF] truncate">
              {draftEndDate ? formatDate(draftEndDate) : "End date"}
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 text-center text-lg font-medium text-neutral-200">
            {WEEK_DAYS.map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center">
            {cells.map((cell, index) => {
              const isCurrentMonth = cell.monthOffset === 0;
              const isStart = isSameDay(cell.date, draftStartDate);
              const isEnd = isSameDay(cell.date, draftEndDate);
              const isBoundary = isStart || isEnd;
              const isInRange = inDraftRange(cell.date);

              return (
                <button
                  key={`${cell.monthOffset}-${cell.day}-${index}`}
                  type="button"
                  onClick={() => handleDayClick(cell.date)}
                  className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-lg transition-colors ${
                    isBoundary
                      ? "border border-[#8B5CF6] text-white"
                      : isInRange
                        ? "bg-[#8B5CF6]/20 text-neutral-100"
                      : isCurrentMonth
                        ? "text-neutral-100 hover:bg-white/10"
                        : "text-[#6B7280]"
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setDraftStartDate(startDate);
                setDraftEndDate(endDate);
                setIsOpen(false);
              }}
              className="rounded-xl border border-[#6B7280] py-3 text-xl font-semibold text-neutral-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const nextStart = draftStartDate ?? startDate ?? new Date(viewDate.getFullYear(), 0, 1);
                const nextEnd = draftEndDate ?? draftStartDate ?? endDate ?? new Date(viewDate.getFullYear(), 11, 31);
                setStartDate(nextStart);
                setEndDate(nextEnd);
                const appliedYear = nextEnd.getFullYear();
                onChange?.(appliedYear);
                setIsOpen(false);
              }}
              className="rounded-xl bg-[#7B00D4] py-3 text-xl font-semibold text-white"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
