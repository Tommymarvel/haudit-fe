import React from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { Switch } from "@/components/ui/Switch";
import { Calendar, Plus, ChevronDown } from "lucide-react";
import { Menu } from "@/components/ui/Menu";
import { useState, useMemo } from "react";
import Image from "next/image";
import AdvanceRowActions from "./AdvanceRowActions";
import AdvanceDetailsModal, { AdvanceDetails } from "./AdvanceDetailsModal";
import RepaymentModal from "./RepaymentModal";
import AddAdvanceModal, { NewAdvancePayload } from "./AddAdvanceModal";
import { BRAND } from "@/lib/brand";
import { useAdvance } from "@/hooks/useAdvance";
import { uploadFile } from "@/lib/utils/upload";

type Row = {
  id: string;
  date: string;
  amount: number;
  type: "Personal" | "Marketing";
  status: "Repaid" | "Outstanding" | "Pending";
  source: string;
  totalAdvance?: number;
  repaidAdvance?: number;
  advanceBalance?: number;
  phone?: string;
  email?: string;
};

const SoloArtistAdvance = () => {
  const { advances, overview, marketingTrend, personalTrend, typePercentage, createAdvance, createRepayment, getRepayments } =
    useAdvance();
  const [tab, setTab] = useState<"analytics" | "source">("analytics");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [openDetails, setOpenDetails] = useState(false);
  const [detailsData, setDetailsData] = useState<AdvanceDetails | null>(null);
  const [openRepay, setOpenRepay] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<Row | null>(null);

  const rows: Row[] = useMemo(() => {
    if (!advances) return [];
    return advances.map((adv) => ({
      id: adv._id,
      date: new Date((adv.createdAt || adv.created_at) as string).toLocaleDateString(),
      amount: adv.amount,
      type: ((() => {
        const t = (adv.advance_type || '').toLowerCase();
        return t === 'marketting' || t === 'marketing' ? 'Marketing' : 'Personal';
      })()) as "Personal" | "Marketing",
      status: (adv.repayment_status.charAt(0).toUpperCase() +
        adv.repayment_status.slice(1)) as "Repaid" | "Outstanding" | "Pending",
      source: adv.advance_source_name,
      totalAdvance: adv.amount,
      repaidAdvance: adv.repaid_amount ?? 0,
      advanceBalance: Math.max(0, adv.amount - (adv.repaid_amount ?? 0)),
      phone: adv.advance_source_phn,
      email: adv.advance_source_email,
    }));
  }, [advances]);

  const kpis = useMemo(() => {
    if (!overview) return { sources: 0, total: 0, repaid: 0 };

    return {
      sources: overview.totalAdvanceSources,
      total: overview.totalAdvanceUSD,
      repaid: overview.totalRepaidUSD,
    };
  }, [overview]);

  const charts = useMemo(() => {
    const marketingTrendData = (marketingTrend || []).map((item) => ({
      label: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: item.totalUSD,
    }));

    const personalTrendData = (personalTrend || []).map((item) => ({
      label: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: item.totalUSD,
    }));

    const realDonut = [
      { name: "Marketing", value: typePercentage?.marketting?.totalUSD || 0, color: BRAND.purple },
      { name: "Personal", value: typePercentage?.personal?.totalUSD || 0, color: BRAND.green },
    ];

    return {
      marketing: marketingTrendData.length > 0 ? marketingTrendData : [{ label: 'No data', value: 0 }],
      personal: personalTrendData.length > 0 ? personalTrendData : [{ label: 'No data', value: 0 }],
      donut: realDonut,
    };
  }, [marketingTrend, personalTrend, typePercentage]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (status === "All" || r.status === status) &&
          (q === "" || r.source.toLowerCase().includes(q.toLowerCase()))
      ),
    [q, status, rows]
  );

  const openDetailsFor = async (r: Row) => {
    try {
      const repayments = await getRepayments(r.id);
      const repaidAmount = repayments.reduce((sum, rep) => sum + rep.amount, 0);

      // Find the full advance object to get purpose and proof_of_payment
      const fullAdvance = advances?.find((a) => a._id === r.id);

      // Calculate running balance for each repayment
      let remainingBalance = r.amount;
      const historyWithBalance = repayments.map((rep) => {
        const repaidAmt = rep.amount;
        remainingBalance -= repaidAmt;
        const dateObj = new Date(rep.createdAt);
        return {
          date: dateObj.toLocaleDateString(),
          time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          repaidAmount: repaidAmt,
          balanceAmount: Math.max(0, remainingBalance),
          proofs: rep.proof_of_payment ? [rep.proof_of_payment] : [],
        };
      }).reverse();

      setDetailsData({
        id: r.id,
        date: r.date,
        status: r.status,
        amount: r.amount,
        repaidAmount: repaidAmount,
        type: r.type,
        source: r.source,
        phone: r.phone || "",
        email: r.email || "",
        proofs: fullAdvance?.proof_of_payment ? [fullAdvance.proof_of_payment] : [],
        purpose: fullAdvance?.purpose || "",
        history: historyWithBalance,
      });
      setOpenDetails(true);
    } catch (error) {
      console.error("Failed to fetch details", error);
    }
  };

  const handleRepayClick = (r: Row) => {
    setSelectedAdvance(r);
    setOpenRepay(true);
  };

  const outstandingAdvances = useMemo(() => {
    return rows
      .filter((r) => r.status === "Outstanding")
      .map((r) => ({
        id: r.id,
        source: r.source,
        amount: r.amount,
        balance: r.advanceBalance || r.amount,
      }));
  }, [rows]);

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
              { label: "Export analytics", onClick: () => { } },
              { label: "Export data", onClick: () => { } },
            ]}
          />

          {/* Add Advance — full width on mobile (spans 2 cols), normal on lg */}
          <Menu
            trigger={
              <Button
                variant="primary"
                className="col-span-2 w-full rounded-2xl lg:col-span-1 lg:w-auto gap-2"
                style={{ backgroundColor: BRAND.purple }}
              >
                <Plus className="h-4 w-4" /> Record Advance{" "}
                <ChevronDown className="h-4 w-4" />
              </Button>
            }
            items={[
              { label: "Add new advance", onClick: () => setOpenAdd(true) },
              { label: "Advance repayment", onClick: () => setOpenRepay(true) },
            ]}
          />

        </div>
      </div>

      {/* KPIs */}
      <div className="mt-5 flex flex-nowrap lg:grid lg:grid-cols-3 gap-4 overflow-x-auto lg:overflow-x-visible pb-2">
        <StatCard
          className="min-w-[280px] lg:min-w-0 flex-shrink-0"
          title="Total advance source"
          value={kpis.sources}
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
          className="min-w-[280px] lg:min-w-0 flex-shrink-0"
          title="Total Advance"
          value={`$${kpis.total.toLocaleString()}`}
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
          className="min-w-[280px] lg:min-w-0 flex-shrink-0"
          title="Repaid Advance"
          value={`$${kpis.repaid.toLocaleString()}`}
          icon={
            <Image src="/svgs/repaid.svg" width={48} height={48} alt="haudit" />
          }
        />
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-neutral-200">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setTab("analytics")}
            className={`px-1 py-2 text-sm ${tab === "analytics"
                ? "text-neutral-900 font-medium border-b-2 border-[color:#7B00D4]"
                : "text-neutral-500"
              }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setTab("source")}
            className={`px-1 py-2 text-sm ${tab === "source"
                ? "text-neutral-900 font-medium border-b-2 border-[color:#7B00D4]"
                : "text-neutral-500"
              }`}
          >
            Advance source
          </button>
        </div>
      </div>

      {tab === "analytics" ? (
        <>
          {/* Trends + donut */}
          <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="lg:col-span-1">
              <ChartCard
                title="Marketing advance trend"
                variant="line"
                data={charts.marketing}
                xKey="label"
                yKey="value"
                color={BRAND.purple}
                bandFill="#F4F4F4"
                lineType="monotone"
              />
            </div>
            <div className="lg:col-span-1">
              <ChartCard
                title="Personal advance trend"
                variant="line"
                data={charts.personal}
                xKey="label"
                yKey="value"
                color={BRAND.green}
                bandFill="#F4F4F4"
                lineType="monotone"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-6">
            {" "}
            {/* Table */}
            <Card className="xl:col-span-2 h-[420px] flex flex-col">
              <CardBody className="p-0! flex flex-col h-full">
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

                <div className="flex-1 overflow-x-auto overflow-y-auto">
                  <table className="w-full text-base">
                    <thead className="sticky top-0 z-10 text-left text-neutral-500 bg-[#F4F4F4]">
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
                              onRepay={() => handleRepayClick(r)}
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
            <div className="xl:col-span-1">
              <ChartCard
                title="Advance type"
                variant="donut"
                data={charts.donut}
                donutInnerText={"Total\nAdvance"}
                bandFill="#F4F4F4"
              />
            </div>
          </div>
        </>
      ) : (
        // “Advance source” tab placeholder
        <Card className="flex-1 mt-8 h-[420px] flex flex-col">
          <CardBody className="p-0! flex flex-col h-full">
            <div className="flex flex-wrap items-center justify-between p-3 gap-3">
              <div className="text-sm font-semibold text-[#3C3C3C]">
                All advance source{" "}
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

            <div className="flex-1 overflow-x-auto overflow-y-auto">
              <table className="w-full text-base">
                <thead className="sticky top-0 z-10 text-left text-neutral-500 bg-[#F4F4F4]">
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
                        ${r.totalAdvance?.toLocaleString() || "0"}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        ${r.repaidAdvance?.toLocaleString() || "0"}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        ${r.advanceBalance?.toLocaleString() || "0"}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {r.phone || "N/A"}
                      </td>
                      <td className="py-3 pr-3 whitespace-nowrap">
                        {r.email || "N/A"}
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
        onClose={() => {
          setOpenRepay(false);
          setSelectedAdvance(null);
        }}
        advances={outstandingAdvances}
        preselectedAdvanceId={selectedAdvance?.id}
        onSubmit={async ({ advanceId, amount, files }) => {
          const targetAdvanceId = advanceId || selectedAdvance?.id;
          if (!targetAdvanceId) return;

          try {
            let proofUrl = "";
            if (files.length > 0) {
              proofUrl = await uploadFile(files[0], "repayment");
            }

            await createRepayment({
              advance_id: targetAdvanceId,
              amount,
              proof_of_payment: proofUrl,
            });
            setOpenRepay(false);
            setSelectedAdvance(null);
          } catch (error) {
            console.error("Repayment failed", error);
          }
        }}
      />
      <AddAdvanceModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSubmit={async (payload: NewAdvancePayload) => {
          try {
            let proofUrl = "";
            if (payload.proofs && payload.proofs.length > 0) {
              proofUrl = await uploadFile(payload.proofs[0], "advance");
            }

            await createAdvance({
              amount: payload.amount,
              currency: "NGN", // Default currency
              advance_source_name: payload.sourceName,
              advance_source_phn: payload.phone,
              advance_source_email: payload.email,
              advance_type: payload.advanceType,
              repayment_status: payload.repaymentStatus,
              proof_of_payment: proofUrl,
              purpose: payload.purpose || "",
            });
            setOpenAdd(false);
          } catch (error) {
            console.error("Create advance failed", error);
          }
        }}
      />
    </div>
  );
};

export default SoloArtistAdvance;
