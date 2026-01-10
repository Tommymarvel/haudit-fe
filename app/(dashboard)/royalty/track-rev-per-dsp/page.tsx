// TrackRevenuePerDSPPanel.tsx
"use client";
import { useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Calendar } from "lucide-react";
import { BRAND } from "@/lib/brand";
import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ComposedChart,
} from "recharts";

type Row = {
  track: string;
  values: number[]; // per DSP index 0..6
};

// Example: your table rows
const rowsSeed: Row[] = [
  { track: "Track A", values: [87, 50, 70, 100, 88, 30, 100] },
  { track: "Track B", values: [60, 55, 62, 72, 50, 40, 65] },
  { track: "Track C", values: [68, 15, 39, 41, 60, 81, 35] },
  // ...
];

const dspLabels = [
  "DSP 1",
  "DSP 2",
  "DSP 3",
  "DSP 4",
  "DSP 5",
  "DSP 6",
  "DSP 7",
];

export default function TrackRevenuePerDSPPanel() {
  const [rows] = useState<Row[]>(rowsSeed);
  const [selected, setSelected] = useState<Set<string>>(new Set(["Track A"]));

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const allChecked = selected.size === rows.length;
  const toggleAll = () =>
    setSelected((prev) =>
      prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.track))
    );

  // Transform to chart data: [{ x:'DSP 1', 'Track A':500, 'Track B':... }, ...]
  const chartData = useMemo(() => {
    return dspLabels.map((label, idx) => {
      const point: Record<string, unknown> = { x: label };
      rows.forEach((r) => {
        if (selected.has(r.track)) point[r.track] = r.values[idx] ?? null;
      });
      return point;
    });
  }, [rows, selected]);

  return (
    <AppShell>
      <div>
        {/* Header row */}
        <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-[#3C3C3C]">
              Track revenue per DSP
            </h1>
            <p className="text-base text-[#777777]">
              Dashboard / Royalty /{" "}
              <span className="text-[#7B00D4] font-bold">
                Track revenue per DSP
              </span>
            </p>
          </div>
          <div className="w-full lg:w-fit flex gap-2">
            <Button
              variant="outline"
              className="w-full bg-[#EAEAEA] rounded-2xl lg:w-auto"
            >
              <Calendar className="h-4 w-4" /> Year
            </Button>
            <Button
              variant="primary"
              className="w-full rounded-2xl lg:w-auto"
              style={{ backgroundColor: BRAND.purple }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clip-path="url(#clip0_1_9428)">
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M11.3223 1.66602C11.7136 1.66611 12.0924 1.80388 12.3923 2.05518L12.5007 2.15435L16.179 5.83268C16.4557 6.10937 16.6262 6.47458 16.6607 6.86435L16.6673 7.01101V9.99935H15.0007V8.33268H11.2507C10.9399 8.33267 10.6403 8.21692 10.4103 8.008C10.1803 7.79908 10.0363 7.51198 10.0065 7.20268L10.0007 7.08268V3.33268H5.00065V16.666H10.0007V18.3327H5.00065C4.58017 18.3328 4.17518 18.174 3.86686 17.8881C3.55854 17.6022 3.36969 17.2103 3.33815 16.791L3.33398 16.666V3.33268C3.33385 2.9122 3.49266 2.50721 3.77857 2.19889C4.06447 1.89057 4.45635 1.70172 4.87565 1.67018L5.00065 1.66602H11.3223ZM15.5898 12.0535L17.9465 14.4102C18.1027 14.5665 18.1905 14.7784 18.1905 14.9993C18.1905 15.2203 18.1027 15.4322 17.9465 15.5885L15.5898 17.9452C15.5129 18.0248 15.421 18.0883 15.3193 18.1319C15.2177 18.1756 15.1083 18.1986 14.9977 18.1996C14.887 18.2005 14.7773 18.1794 14.6749 18.1375C14.5724 18.0956 14.4794 18.0338 14.4012 17.9555C14.3229 17.8773 14.261 17.7842 14.2191 17.6818C14.1772 17.5794 14.1561 17.4697 14.1571 17.359C14.1581 17.2484 14.1811 17.139 14.2247 17.0373C14.2684 16.9357 14.3319 16.8437 14.4115 16.7668L15.3457 15.8327H11.6673C11.4463 15.8327 11.2343 15.7449 11.0781 15.5886C10.9218 15.4323 10.834 15.2204 10.834 14.9993C10.834 14.7783 10.9218 14.5664 11.0781 14.4101C11.2343 14.2538 11.4463 14.166 11.6673 14.166H15.3457L14.4115 13.2318C14.2551 13.0756 14.1672 12.8636 14.1671 12.6426C14.1671 12.4215 14.2548 12.2095 14.4111 12.0531C14.5673 11.8967 14.7793 11.8088 15.0004 11.8088C15.2214 11.8087 15.4335 11.8964 15.5898 12.0527V12.0535ZM11.6673 3.67768V6.66602H14.6557L11.6673 3.67768Z"
                    fill="white"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_1_9428">
                    <rect width="20" height="20" fill="white" />
                  </clipPath>
                </defs>
              </svg>
              Export Table
            </Button>
          </div>
        </div>

        <div className="mt-7 space-y-4">
          {/* Chart without ChartCard wrapper */}
          <div className="h-[400px] w-full bg-white rounded-xl">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ left: 0, right: 10, top: 6, bottom: 24 }}
              >
                <defs>
                  <linearGradient
                    id="trackAGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#7B00D4" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#7B00D4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="trackBGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#00AA39" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#00AA39" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="trackCGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="#E5E7EB"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="x"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#AAAAAA", fontSize: 14 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#AAAAAA", fontSize: 14 }}
                  padding={{ bottom: 8 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "none",
                    borderRadius: "12px",
                    color: "white",
                  }}
                />
                {Array.from(selected).map((trackName) => (
                  <Line
                    key={trackName}
                    type="linear"
                    dataKey={trackName}
                    stroke={colorFor(trackName)}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}

          <div className="overflow-x-auto mt-8">
            <table className="w-full text-base">
              <thead className="text-left text-neutral-500 bg-[#F4F4F4]">
                <tr>
                  <th className="py-3 pl-3 pr-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded accent-black"
                    />
                  </th>
                  <th className="py-3 pr-4 whitespace-nowrap">Track</th>
                  {dspLabels.map((d) => (
                    <th
                      key={d}
                      className="py-3 pr-4 whitespace-nowrap text-center"
                    >
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((r) => {
                  const checked = selected.has(r.track);
                  return (
                    <tr key={r.track} className="text-neutral-800">
                      <td className="py-3 pl-3 pr-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(r.track)}
                          className="h-4 w-4 rounded accent-black"
                        />
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">{r.track}</div>
                      </td>
                      {r.values.map((v, i) => (
                        <td
                          key={i}
                          className="py-3 pr-4 whitespace-nowrap text-center tabular-nums"
                        >
                          ${v.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function colorFor(name: string) {
  const colors = [
    "#7B00D4",
    "#00AA39",
    "#F59E0B",
    "#EF4444",
    "#3B82F6",
    "#14B8A6",
    "#8B5CF6",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return colors[Math.abs(hash) % colors.length];
}
