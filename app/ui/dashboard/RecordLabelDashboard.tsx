"use client";
import { useMemo, useState } from "react";
import Topbar from "@/components/layout/Topbar";
import { ChartCard, DonutSlice } from "@/components/dashboard/ChartCard";
import { useRoyalty } from "@/hooks/useRoyalty";
import { useAdvance } from "@/hooks/useAdvance";
import { useExpenses } from "@/hooks/useExpenses";
import { useRecordLabel } from "@/hooks/useRecordLabel";
import { useRecordLabelArtists } from "@/hooks/useRecordLabelArtists";
import { useUnrecognizedArtists } from "@/hooks/useUnrecognizedArtists";
import { uploadFile } from "@/lib/utils/upload";
import { BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/Button";
import { Menu } from "@/components/ui/Menu";
import { StatusPill } from "@/components/ui/StatusPill";
import { Search, ChevronDown, MoreVertical, Table2 } from "lucide-react";
import UploadFileModal from "@/components/ui/UploadFileModal";
import AddAdvanceModal, {
  NewAdvancePayload,
} from "@/ui/advance/AddAdvanceModal";
import AddExpensesModal, {
  NewExpensesPayload,
} from "@/ui/expenses/AddExpensesModal";
import UnrecognizedArtistsModal from "@/components/ui/UnrecognizedArtistsModal";
import IgnoreUnrecognizedConfirmModal from "@/components/ui/IgnoreUnrecognizedConfirmModal";
import QuickActionsBar from "@/components/dashboard/QuickActionsBar";
import { Pagination } from "@/components/ui/Pagination";
import { getRecordLabelArtistName } from "@/lib/utils/recordLabelArtist";

type Tab = "Track" | "Album" | "Advance" | "Expenses";

type TopPerformanceRow = {
  name: string;
  artist: string;
  revenue: string;
  streams: string;
};

type TopAdvanceRow = {
  id: string;
  date: string;
  amount: string;
  type: string;
  status: "Repaid" | "Outstanding" | "Pending" | "Approved" | "Rejected" | "Paid";
  purpose: string;
};

type TopExpenseRow = {
  id: string;
  date: string;
  artist: string;
  category: string;
  status: "Repaid" | "Outstanding" | "Pending" | "Approved" | "Rejected" | "Paid";
  amount: string;
};

const ALBUM_INTERACTION_COLORS = ["#00D447", BRAND.purple, "#3B82F6", "#F59E0B", "#EF4444"];

export default function RecordLabelDashboard() {
  const { uploadRoyaltyFile, dashboardMetrics, albumPerformance, albumInteractions } = useRoyalty();
  const { createAdvance, marketingTrend, personalTrend, typePercentage } =
    useAdvance();
  const { createExpense, trend: expensesTrend } = useExpenses();
  const { dashboard, topTracks, topAlbums, topAdvances, topExpenses } =
    useRecordLabel();
  const { artists: recordLabelArtistsList } = useRecordLabelArtists();
  const { assignPendingArtists, refreshPendingArtists } =
    useUnrecognizedArtists();
  const [activeTab, setActiveTab] = useState<Tab>("Track");
  const [openUpload, setOpenUpload] = useState(false);
  const [openAdvance, setOpenAdvance] = useState(false);
  const [openExpense, setOpenExpense] = useState(false);
  const [expensesPage, setExpensesPage] = useState(1);
  const [pendingUnmatchedArtists, setPendingUnmatchedArtists] = useState<
    string[]
  >([]);
  const [openUnrecognizedModal, setOpenUnrecognizedModal] = useState(false);
  const [openIgnoreConfirm, setOpenIgnoreConfirm] = useState(false);

  const handleUpload = async (
    file: File,
    organization: string,
    onProgress: (msg: string) => void,
  ) => {
    try {
      const result = await uploadRoyaltyFile(file, organization, onProgress);
      setOpenUpload(false);

      if (result.unmatchedArtists && result.unmatchedArtists.length > 0) {
        setPendingUnmatchedArtists(result.unmatchedArtists);
        setOpenUnrecognizedModal(true);
      }
    } catch (error) {
      console.error("Upload failed", error);
    }
  };

  const recordLabelArtists = useMemo(() => {
    const uniqueById = new Map<string, string>();
    recordLabelArtistsList.forEach((artist) => {
      const id = (artist.id || artist._id || "").toString().trim();
      const name = getRecordLabelArtistName(artist);
      if (!id || !name) return;
      if (!uniqueById.has(id)) uniqueById.set(id, name);
    });
    return Array.from(uniqueById.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) =>
        left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
      );
  }, [recordLabelArtistsList]);

  const recordLabelArtistOptions = useMemo(
    () => recordLabelArtists.map((artist) => ({ id: artist.id, name: artist.name })),
    [recordLabelArtists],
  );

  const handleResolveUnrecognizedArtists = async (
    mappings: Record<string, string>,
  ) => {
    if (Object.keys(mappings).length === 0) return;
    await assignPendingArtists(mappings);
    setOpenUnrecognizedModal(false);
    setPendingUnmatchedArtists([]);
    await refreshPendingArtists();
  };

  const handleIgnoreFromModal = () => {
    setOpenIgnoreConfirm(true);
  };

  const handleConfirmIgnore = async () => {
    setOpenIgnoreConfirm(false);
    setOpenUnrecognizedModal(false);
    setPendingUnmatchedArtists([]);
    await refreshPendingArtists();
  };

  const handleAddAdvance = async (payload: NewAdvancePayload) => {
    try {
      let proofUrl = "";
      if (payload.proofs && payload.proofs.length > 0) {
        proofUrl = await uploadFile(payload.proofs[0], "advance");
      }
      await createAdvance({
        amount: payload.amount,
        currency: payload.currency,
        advance_source_name: payload.sourceName,
        advance_source_phn: payload.phone,
        advance_source_email: payload.email,
        advance_type: payload.advanceType,
        repayment_status: payload.repaymentStatus,
        proof_of_payment: proofUrl,
        purpose: payload.purpose || "",
      });
      setOpenAdvance(false);
    } catch (error) {
      console.error("Create advance failed", error);
    }
  };

  const handleAddExpense = async (payload: NewExpensesPayload) => {
    try {
      let receiptUrl = "";
      if (payload.proofs && payload.proofs.length > 0) {
        receiptUrl = await uploadFile(payload.proofs[0], "expense");
      }
      await createExpense({
        artistId: payload.artistId,
        expense_date: payload.expense_date,
        category: payload.category,
        currency: payload.currency,
        amount: payload.amount,
        recoupable: payload.recoupable,
        description: payload.description,
        receipt_url: receiptUrl,
      });
      setOpenExpense(false);
    } catch (error) {
      console.error("Create expense failed", error);
    }
  };

  const formatCurrency = (amount: number) =>
    `$${amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  const formatCount = (value: number) => value.toLocaleString();
  const formatDate = (dateLike?: string) => {
    if (!dateLike) return "-";
    const parsed = new Date(dateLike);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");
  };
  const titleCase = (value?: string) => {
    if (!value) return "-";
    return value
      .replace(/[_-]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  };
  const normalizeStatus = (
    status?: string,
  ): "Repaid" | "Outstanding" | "Pending" | "Approved" | "Rejected" | "Paid" => {
    const key = (status || "").trim().toLowerCase();
    if (key === "repaid") return "Repaid";
    if (key === "paid") return "Paid";
    if (key === "outstanding") return "Outstanding";
    if (key === "approved") return "Approved";
    if (key === "rejected") return "Rejected";
    return "Pending";
  };
  const formatAmountWithCurrency = (amount?: number, currency?: string) => {
    const normalizedAmount = Number(amount ?? 0);
    if (!Number.isFinite(normalizedAmount)) return "$0";
    if (currency && currency.toUpperCase() !== "USD") {
      return `${currency.toUpperCase()} ${normalizedAmount.toLocaleString()}`;
    }
    return formatCurrency(normalizedAmount);
  };
  const formatMomChange = (value?: number | null) => {
    if (typeof value !== "number" || Number.isNaN(value)) return null;
    const isUp = value >= 0;
    const tone = isUp
      ? {
          bg: "bg-emerald-100",
          text: "text-emerald-600",
          path: "M8.5 3.5L3.5 8.5M8.5 3.5H4.5M8.5 3.5V7.5",
        }
      : {
          bg: "bg-rose-50",
          text: "text-rose-500",
          path: "M3.5 3.5L8.5 8.5M8.5 8.5V4.5M8.5 8.5H4.5",
        };

    return {
      ...tone,
      label: `${Math.abs(value).toFixed(0)}%`,
    };
  };

  const totalArtistsValue = Number(dashboard?.totalArtists?.value ?? 0);
  const totalTracksValue = Number(dashboard?.totalTracks?.value ?? 0);
  const advanceRepaymentValue = Number(
    dashboard?.advanceRepaymentTotal?.valueUSD ?? 0,
  );
  const totalTracksMom = formatMomChange(dashboard?.totalTracks?.momChange);
  const advanceRepaymentMom = formatMomChange(
    dashboard?.advanceRepaymentTotal?.momChange,
  );

  const trackInteractionPerformanceData = useMemo(() => {
    return (dashboardMetrics?.streamsByMonth ?? []).map((point) => ({
      label: point.label || "-",
      date: point.label || "-",
      value: Number(point.streams ?? 0),
    }));
  }, [dashboardMetrics]);

  const albumInteractionPerformanceData = useMemo(() => {
    const monthMap = new Map<
      string,
      { label: string; date: string; value: number }
    >();

    (albumPerformance ?? []).forEach((point) => {
      const parsed = new Date(point.day);
      if (Number.isNaN(parsed.getTime())) return;
      const key = `${parsed.getUTCFullYear()}-${String(
        parsed.getUTCMonth() + 1,
      ).padStart(2, "0")}`;
      const existing = monthMap.get(key);
      if (existing) {
        existing.value += Number(point.streams ?? 0);
        return;
      }
      monthMap.set(key, {
        label: parsed.toLocaleDateString("en-US", { month: "short" }),
        date: point.day,
        value: Number(point.streams ?? 0),
      });
    });

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value);
  }, [albumPerformance]);

  const topTracksData: TopPerformanceRow[] = (topTracks ?? []).map(
    (item, index) => ({
      name: item.trackName || item.isrc || `Track ${index + 1}`,
      artist: item.artistName || "-",
      revenue: formatCurrency(Number(item.totalRevenueUSD || 0)),
      streams: formatCount(Number(item.totalStreams || 0)),
    }),
  );

  const topAlbumsData: TopPerformanceRow[] = (topAlbums ?? []).map(
    (item, index) => ({
      name: item.albumName || `Album ${index + 1}`,
      artist: item.artistName || "-",
      revenue: formatCurrency(Number(item.totalRevenueUSD || 0)),
      streams: formatCount(Number(item.totalStreams || 0)),
    }),
  );

  const trackInteractionData = useMemo<DonutSlice[]>(() => {
    const totalStreams = (topTracks ?? []).reduce(
      (sum, item) => sum + Number(item.totalStreams || 0),
      0,
    );
    if (totalStreams <= 0) return [];
    return [{ name: "Stream", value: totalStreams, color: "#00D447" }];
  }, [topTracks]);

  const albumInteractionData = useMemo<DonutSlice[]>(() => {
    return (albumInteractions ?? [])
      .map((item, index) => ({
        name: item.saleType,
        value: Number(item.count ?? 0),
        color: ALBUM_INTERACTION_COLORS[index % ALBUM_INTERACTION_COLORS.length],
      }))
      .filter((item) => item.value > 0);
  }, [albumInteractions]);

  const advanceTrendData = useMemo(() => {
    const monthMap = new Map<
      string,
      { label: string; date: string; value: number }
    >();
    [...(marketingTrend ?? []), ...(personalTrend ?? [])].forEach((point) => {
      const parsed = new Date(point.date);
      if (Number.isNaN(parsed.getTime())) return;
      const key = `${parsed.getUTCFullYear()}-${String(
        parsed.getUTCMonth() + 1,
      ).padStart(2, "0")}`;
      const existing = monthMap.get(key);
      if (existing) {
        existing.value += Number(point.totalUSD || 0);
        return;
      }
      monthMap.set(key, {
        label: parsed.toLocaleDateString("en-US", { month: "short" }),
        date: point.date,
        value: Number(point.totalUSD || 0),
      });
    });

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value);
  }, [marketingTrend, personalTrend]);

  const advanceInteractionData = useMemo<DonutSlice[]>(() => {
    const marketingTotal = Number(typePercentage?.marketting?.totalUSD ?? 0);
    const personalTotal = Number(typePercentage?.personal?.totalUSD ?? 0);
    if (marketingTotal <= 0 && personalTotal <= 0) return [];
    return [
      { name: "Marketing", value: marketingTotal, color: "#00D447" },
      { name: "Personal", value: personalTotal, color: BRAND.purple },
    ];
  }, [typePercentage]);

  const topAdvanceData: TopAdvanceRow[] = (topAdvances ?? []).map(
    (advance, index) => ({
      id: advance.id || advance._id || `ADV-${index + 1}`,
      date: formatDate(advance.createdAt),
      amount: formatAmountWithCurrency(advance.amount, advance.currency),
      type: titleCase(advance.advance_type),
      status: normalizeStatus(advance.status),
      purpose: advance.purpose || "-",
    }),
  );

  const expensesTrendData = useMemo(
    () =>
      (expensesTrend ?? []).map((item) => ({
        label: new Date(item.day).toLocaleDateString("en-US", { month: "short" }),
        date: item.day,
        value: Number(item.amount ?? 0),
      })),
    [expensesTrend],
  );

  const topExpensesData: TopExpenseRow[] = (topExpenses ?? []).map(
    (expense, index) => ({
      id: expense.id || expense._id || `EXP-${index + 1}`,
      date: formatDate(expense.createdAt),
      artist: expense.artistName || "-",
      category: titleCase(expense.category),
      status: normalizeStatus(expense.status),
      amount: formatAmountWithCurrency(expense.amount, expense.currency),
    }),
  );
  const EXPENSES_PAGE_SIZE = 10;
  const expensesTotalPages = Math.max(
    1,
    Math.ceil(topExpensesData.length / EXPENSES_PAGE_SIZE),
  );
  const pagedTopExpensesData = topExpensesData.slice(
    (expensesPage - 1) * EXPENSES_PAGE_SIZE,
    expensesPage * EXPENSES_PAGE_SIZE,
  );
  const activeInteractionPerformanceData =
    activeTab === "Album"
      ? albumInteractionPerformanceData
      : trackInteractionPerformanceData;
  const activeInteractionTypeData =
    activeTab === "Album" ? albumInteractionData : trackInteractionData;

  return (
    <div>
      <Topbar />

      {/* Quick actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mt-6">
        <p className="text-lg font-medium text-neutral-700 hidden lg:block">
          Quick actions
        </p>

        <div className="hidden lg:block">
          <QuickActionsBar
            onAddFile={() => setOpenUpload(true)}
            onAddAdvance={() => setOpenExpense(true)}
            onAddExpense={() => setOpenExpense(true)}
            onMore={() => {}}
            secondaryActionLabel="Add expense"
          />
        </div>

        <div className="block lg:hidden w-full mt-4">
          <Menu
            trigger={
              <Button variant="outline" className="w-full justify-between">
                <p className="text-lg font-medium text-neutral-700">
                  Quick actions
                </p>{" "}
                <ChevronDown className="h-4 w-4" />
              </Button>
            }
            items={[
              {
                label: "Add new royalty record",
                onClick: () => setOpenUpload(true),
              },
              { label: "Add Expense", onClick: () => setOpenExpense(true) },
              { label: "Export Table", onClick: () => {} },
              { label: "Export Analytics", onClick: () => {} },
            ]}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 flex flex-nowrap xl:grid xl:grid-cols-3 gap-6 overflow-x-auto xl:overflow-x-visible pb-2 items-stretch">
        <div className="min-w-[280px] xl:min-w-0 flex-shrink-0 bg-white rounded-3xl border border-neutral-200 p-6 flex flex-col justify-between h-[160px] shadow-[0_2px_10px_0_#7C8DB51F]">
          <div className="flex justify-between items-start">
            <div className=" mb-2">
              <svg
                width="44"
                height="44"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g filter="url(#filter0_d_1_22395)">
                  <rect
                    x="10"
                    y="8"
                    width="44"
                    height="44"
                    rx="12"
                    fill="white"
                    shape-rendering="crispEdges"
                  />
                  <g clip-path="url(#clip0_1_22395)">
                    <path
                      d="M23.8685 22.3685C24.9514 21.2848 26.3599 20.5863 27.8779 20.3801C29.396 20.1739 30.9398 20.4714 32.2725 21.227C33.6052 21.9826 34.6532 23.1545 35.2558 24.563C35.8584 25.9715 35.9823 27.5388 35.6085 29.0245L35.5395 29.2805L38.9395 33.6525C39.2257 34.0205 39.4118 34.4563 39.4797 34.9176C39.5475 35.3788 39.4947 35.8497 39.3265 36.2845C39.4265 36.3145 39.5485 36.3305 39.6985 36.3005L39.8165 36.2695C40.0662 36.1924 40.3363 36.2162 40.5687 36.3357C40.8012 36.4552 40.9776 36.661 41.0602 36.909C41.1428 37.1569 41.125 37.4274 41.0107 37.6624C40.8964 37.8975 40.6946 38.0784 40.4485 38.1665C40.0244 38.3131 39.571 38.3543 39.1274 38.2866C38.6839 38.2188 38.2635 38.0441 37.9025 37.7775C37.4877 37.961 37.0333 38.0371 36.5813 37.9986C36.1294 37.9602 35.6944 37.8085 35.3165 37.5575L35.1525 37.4405L30.7805 34.0395C29.2884 34.4752 27.6937 34.4019 26.2479 33.8311C24.8021 33.2603 23.5874 32.2245 22.7953 30.887C22.0032 29.5495 21.6789 27.9865 21.8734 26.4443C22.0679 24.9021 22.7702 23.4685 23.8695 22.3695L23.8685 22.3685ZM34.5775 31.3005C34.0964 31.9946 33.4945 32.5965 32.8005 33.0775L36.3805 35.8615C36.5153 35.9633 36.6824 36.0129 36.8509 36.0011C37.0195 35.9894 37.1781 35.9171 37.2975 35.7976C37.4169 35.678 37.489 35.5194 37.5006 35.3508C37.5122 35.1823 37.4624 35.0153 37.3605 34.8805L34.5775 31.3005ZM32.9205 24.4595L32.7175 24.7955C31.911 26.0948 30.9581 27.2974 29.8775 28.3795C28.7956 29.4597 27.5934 30.4122 26.2945 31.2185L25.9585 31.4215C26.9215 32.0923 28.0898 32.4031 29.2589 32.2993C30.4279 32.1956 31.5232 31.684 32.3531 30.8542C33.183 30.0243 33.6946 28.9289 33.7983 27.7599C33.902 26.5908 33.5913 25.4226 32.9205 24.4595ZM31.4225 23.0495C30.4649 22.4662 29.3391 22.2216 28.2258 22.3549C27.1125 22.4881 26.0763 22.9916 25.2834 23.7845C24.4906 24.5773 23.9871 25.6135 23.8538 26.7268C23.7206 27.8401 23.9652 28.9659 24.5485 29.9235L24.8725 29.7405C26.1821 28.9708 27.389 28.0384 28.4645 26.9655C29.4354 25.9922 30.2917 24.9108 31.0165 23.7425L31.1325 23.5525L31.3355 23.2055L31.4225 23.0495Z"
                      fill="#7B00D4"
                    />
                  </g>
                </g>
                <defs>
                  <filter
                    id="filter0_d_1_22395"
                    x="0"
                    y="0"
                    width="64"
                    height="64"
                    filterUnits="userSpaceOnUse"
                    color-interpolation-filters="sRGB"
                  >
                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    />
                    <feOffset dy="2" />
                    <feGaussianBlur stdDeviation="5" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0.486275 0 0 0 0 0.552941 0 0 0 0 0.709804 0 0 0 0.12 0"
                    />
                    <feBlend
                      mode="normal"
                      in2="BackgroundImageFix"
                      result="effect1_dropShadow_1_22395"
                    />
                    <feBlend
                      mode="normal"
                      in="SourceGraphic"
                      in2="effect1_dropShadow_1_22395"
                      result="shape"
                    />
                  </filter>
                  <clipPath id="clip0_1_22395">
                    <rect
                      width="24"
                      height="24"
                      fill="white"
                      transform="translate(20 18)"
                    />
                  </clipPath>
                </defs>
              </svg>
            </div>
          </div>
          <div>
            <div className="text-3xl font-semibold text-[#3C3C3C]">
              {formatCount(totalArtistsValue)}
            </div>
            <div className="flex justify-between items-center w-full mt-2">
              <div className="text-base text-[#5A5A5A]">Total Artist</div>
              <button className="text-xs text-[#5A5A5A]">View Artist</button>
            </div>
          </div>
        </div>

        <div className="min-w-[280px] xl:min-w-0 flex-shrink-0 bg-white rounded-3xl border border-neutral-200 p-6 flex flex-col justify-between h-[160px] shadow-[0_2px_10px_0_#7C8DB51F]">
          <div className="flex justify-between items-start">
            <div>
                <div className="text-3xl font-semibold leading-none text-[#3C3C3C]">
                  {formatCount(totalTracksValue)}
                </div>
              <div className="mt-4 text-base text-[#5A5A5A]">Total Tracks</div>
            </div>
            <div className="mb-2">
              <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g filter="url(#filter0_d_1_22410)">
                  <rect
                    x="10"
                    y="8"
                    width="44"
                    height="44"
                    rx="12"
                    fill="white"
                    shape-rendering="crispEdges"
                  />
                  <g clip-path="url(#clip0_1_22410)">
                    <path
                      d="M33.586 20C34.0556 20.0001 34.5101 20.1654 34.87 20.467L35 20.586L39.414 25C39.746 25.332 39.9506 25.7703 39.992 26.238L40 26.414V38C40.0002 38.5046 39.8096 38.9906 39.4665 39.3605C39.1234 39.7305 38.6532 39.9572 38.15 39.995L38 40H26C25.4954 40.0002 25.0094 39.8096 24.6395 39.4665C24.2695 39.1234 24.0428 38.6532 24.005 38.15L24 38V22C23.9998 21.4954 24.1904 21.0094 24.5335 20.6395C24.8766 20.2695 25.3468 20.0428 25.85 20.005L26 20H33.586ZM32 22H26V38H38V28H33.5C33.1022 28 32.7206 27.842 32.4393 27.5607C32.158 27.2794 32 26.8978 32 26.5V22ZM34.449 29.684C34.4905 29.8086 34.5071 29.9402 34.4978 30.0712C34.4884 30.2023 34.4534 30.3302 34.3946 30.4476C34.3358 30.5651 34.2544 30.6699 34.1552 30.7559C34.0559 30.8419 33.9406 30.9075 33.816 30.949L33 31.22V34C33 34.3956 32.8827 34.7822 32.6629 35.1111C32.4432 35.44 32.1308 35.6964 31.7654 35.8478C31.3999 35.9991 30.9978 36.0387 30.6098 35.9616C30.2219 35.8844 29.8655 35.6939 29.5858 35.4142C29.3061 35.1345 29.1156 34.7781 29.0384 34.3902C28.9613 34.0022 29.0009 33.6001 29.1522 33.2346C29.3036 32.8692 29.56 32.5568 29.8889 32.3371C30.2178 32.1173 30.6044 32 31 32V30.86C31 30.5451 31.0991 30.2383 31.2833 29.9829C31.4674 29.7275 31.7273 29.5365 32.026 29.437L33.184 29.051C33.3086 29.0095 33.4402 28.9929 33.5712 29.0022C33.7023 29.0116 33.8302 29.0466 33.9476 29.1054C34.0651 29.1642 34.1699 29.2456 34.2559 29.3448C34.3419 29.4441 34.4075 29.5594 34.449 29.684ZM34 22.414V26H37.586L34 22.414Z"
                      fill="#7B00D4"
                    />
                  </g>
                </g>
                <defs>
                  <filter
                    id="filter0_d_1_22410"
                    x="0"
                    y="0"
                    width="64"
                    height="64"
                    filterUnits="userSpaceOnUse"
                    color-interpolation-filters="sRGB"
                  >
                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    />
                    <feOffset dy="2" />
                    <feGaussianBlur stdDeviation="5" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0.486275 0 0 0 0 0.552941 0 0 0 0 0.709804 0 0 0 0.12 0"
                    />
                    <feBlend
                      mode="normal"
                      in2="BackgroundImageFix"
                      result="effect1_dropShadow_1_22410"
                    />
                    <feBlend
                      mode="normal"
                      in="SourceGraphic"
                      in2="effect1_dropShadow_1_22410"
                      result="shape"
                    />
                  </filter>
                  <clipPath id="clip0_1_22410">
                    <rect
                      width="24"
                      height="24"
                      fill="white"
                      transform="translate(20 18)"
                    />
                  </clipPath>
                </defs>
              </svg>
            </div>
          </div>
          <div className="flex items-end justify-between">
            {totalTracksMom ? (
              <div
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${totalTracksMom.bg} ${totalTracksMom.text}`}
              >
                <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
                  <path
                    d={totalTracksMom.path}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{totalTracksMom.label}</span>
              </div>
            ) : (
              <span className="text-xs text-[#AAAAAA]">No change data</span>
            )}
            <button className="text-sm font-medium text-[#5A5A5A] hover:text-[#3C3C3C] transition-colors">
              View report
            </button>
          </div>
        </div>

        <div className="min-w-[280px] xl:min-w-0 flex-shrink-0 bg-white rounded-3xl border border-neutral-200 p-6 flex flex-col justify-between h-[160px] shadow-[0_2px_10px_0_#7C8DB51F]">
          <div className="flex justify-between items-start">
            <div>
                <div className="text-3xl font-semibold leading-none text-[#3C3C3C]">
                  {formatCurrency(advanceRepaymentValue)}
                </div>
              <div className="mt-4 text-base text-[#5A5A5A]">
                Advance repayment
              </div>
            </div>
            <div className="text-purple-600 w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-2">
              <span className="text-xl font-bold">$</span>
            </div>
          </div>
          <div className="flex items-end justify-between">
            {advanceRepaymentMom ? (
              <div
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${advanceRepaymentMom.bg} ${advanceRepaymentMom.text}`}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d={advanceRepaymentMom.path}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {advanceRepaymentMom.label}
              </div>
            ) : (
              <span className="text-xs text-[#AAAAAA]">No change data</span>
            )}
            <button className="text-sm font-medium text-[#5A5A5A] hover:text-[#3C3C3C] transition-colors">
              View report
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 border-b border-neutral-200">
        <nav className="-mb-px flex gap-4">
          {["Track", "Album", "Advance", "Expenses"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as Tab)}
              className={`whitespace-nowrap border-b-2 px-1 py-1 text-base font-bold ${
                activeTab === tab
                  ? "border-[#7B00D4] text-[#7B00D4]"
                  : "border-transparent text-[#AAAAAA] hover:border-neutral-300 hover:text-neutral-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Track & Album Tabs */}
        {(activeTab === "Track" || activeTab === "Album") && (
          <div className="space-y-6">
            <div className="flex flex-col xl:flex-row gap-4">
              <div className="w-full xl:w-2/3">
                <ChartCard
                  title={
                    activeTab === "Track"
                      ? "Track Interaction Performance"
                      : "Album Interaction performance"
                  }
                  variant="line"
                  data={activeInteractionPerformanceData}
                  xKey="label"
                  yKey="value"
                  color={BRAND.purple}
                  lineType="monotone"
                  headerFilterLabel="Go to royalty"
                  onHeaderFilterClick={() => {}}
                />
              </div>
              <div className="w-full xl:w-1/3">
                <ChartCard
                  title={
                    activeTab === "Track"
                      ? "Track Interaction Type"
                      : "Album Interaction Type"
                  }
                  variant="donut"
                  data={activeInteractionTypeData}
                  donutInnerText={"Total\nInteraction"}
                  isHalfDonut={true}
                />
              </div>
            </div>

            {/* Top Tracks/Albums Table */}
            <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden">
              <div className="p-5 border-b border-neutral-200">
                <h3 className="text-base font-semibold text-[#3C3C3C]">
                  {activeTab === "Track" ? "Top Tracks" : "Top Albums"}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[#3C3C3C] font-medium bg-[#F4F4F4]">
                    <tr>
                      <th className="px-6 py-4 font-medium flex items-center gap-1">
                        {activeTab === "Track" ? "Track" : "Albums"}{" "}
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m7 15 5 5 5-5" />
                          <path d="m7 9 5-5 5 5" />
                        </svg>
                      </th>
                      <th className="px-6 py-4 font-medium">
                        <div className="flex items-center gap-1">
                          Artist{" "}
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m7 15 5 5 5-5" />
                            <path d="m7 9 5-5 5 5" />
                          </svg>
                        </div>
                      </th>
                      <th className="px-6 py-4 font-medium">Revenue</th>
                      <th className="px-6 py-4 font-medium">Streams</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEAEA]">
                    {(activeTab === "Track" ? topTracksData : topAlbumsData)
                      .length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-20">
                          <div className="flex flex-col items-center justify-center text-center">
                            <Table2 className="h-5 w-5 text-[#7B00D4]" />
                            <p className="mt-2 text-sm font-medium text-neutral-700">
                              No records yet
                            </p>
                            <p className="mt-1 max-w-xs text-xs text-[#3C3C3C]">
                              Entries will appear here once financial data is
                              added by your label.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      (activeTab === "Track"
                        ? topTracksData
                        : topAlbumsData
                      ).map((item, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50/50">
                          <td className="px-6 py-4 text-[#3C3C3C] font-normal">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 text-[#3C3C3C]">
                            {item.artist}
                          </td>
                          <td className="px-6 py-4 text-[#3C3C3C]">
                            {item.revenue}
                          </td>
                          <td className="px-6 py-4 text-[#3C3C3C]">
                            {item.streams}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Advance Tab */}
        {activeTab === "Advance" && (
          <div className="space-y-6">
            <div className="flex flex-col xl:flex-row gap-4">
              <div className="w-full xl:w-2/3">
                <ChartCard
                  title="All Advance request trend"
                  variant="line"
                  data={advanceTrendData}
                  xKey="label"
                  yKey="value"
                  color={BRAND.purple}
                  lineType="monotone"
                  headerFilterLabel="Go to advance"
                  onHeaderFilterClick={() => {}}
                />
              </div>
              <div className="w-full xl:w-1/3">
                <ChartCard
                  title="Advance request type"
                  variant="donut"
                  data={advanceInteractionData}
                  donutInnerText={"Total\nrequests"}
                  donutStyle="advance"
                />
              </div>
            </div>

            {/* Top Advance Table */}
            <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden">
              <div className="p-5 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-base font-semibold text-[#3C3C3C]">
                  Top Advance requests
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[#3C3C3C] font-medium bg-[#F4F4F4]">
                    <tr>
                      <th className="px-6 py-4 font-medium">ID</th>
                      <th className="px-6 py-4 font-medium flex items-center gap-1">
                        Date{" "}
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m7 15 5 5 5-5" />
                          <path d="m7 9 5-5 5 5" />
                        </svg>
                      </th>
                      <th className="px-6 py-4 font-medium">Amount</th>
                      <th className="px-6 py-4 font-medium">Advance type</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium w-1/4">Purpose</th>
                      <th className="px-6 py-4 font-medium">Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEAEA] text-base">
                    {topAdvanceData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-20">
                          <div className="flex flex-col items-center justify-center text-center">
                            <Table2 className="h-5 w-5 text-[#7B00D4]" />
                            <p className="mt-2 text-sm font-medium text-neutral-700">
                              No records yet
                            </p>
                            <p className="mt-1 max-w-xs text-xs text-[#3C3C3C]">
                              Entries will appear here once financial data is
                              added by your label.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      topAdvanceData.map((advance, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50/50">
                          <td className="px-6 py-4 text-[#3C3C3C] ">
                            {advance.id}
                          </td>
                          <td className="px-6 py-4 text-[#3C3C3C]">
                            {advance.date}
                          </td>
                          <td className="px-6 py-4 text-[#3C3C3C] ">
                            {advance.amount}
                          </td>
                          <td className="px-6 py-4 text-[#3C3C3C]">
                            {advance.type}
                          </td>
                          <td className="px-6 py-4">
                            <StatusPill label={advance.status} />
                          </td>
                          <td className="px-6 py-4 text-[#3C3C3C] truncate max-w-[200px]">
                            {advance.purpose}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2 text-neutral-400">
                              <button className="hover:text-[#7B00D4]">
                                <svg
                                  width="17"
                                  height="16"
                                  viewBox="0 0 17 16"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M14.1667 0C14.8297 0 15.4656 0.263392 15.9344 0.732233C16.4033 1.20107 16.6667 1.83696 16.6667 2.5V10.8333C16.6667 11.4964 16.4033 12.1323 15.9344 12.6011C15.4656 13.0699 14.8297 13.3333 14.1667 13.3333H4.44417L1.66667 15.4167C0.98 15.9317 0 15.4417 0 14.5833V2.5C0 1.83696 0.263392 1.20107 0.732233 0.732233C1.20107 0.263392 1.83696 0 2.5 0H14.1667ZM14.1667 1.66667H2.5C2.27899 1.66667 2.06702 1.75446 1.91074 1.91074C1.75446 2.06702 1.66667 2.27899 1.66667 2.5V13.3333L3.44417 12C3.73266 11.7836 4.08355 11.6667 4.44417 11.6667H14.1667C14.3877 11.6667 14.5996 11.5789 14.7559 11.4226C14.9122 11.2663 15 11.0543 15 10.8333V2.5C15 2.27899 14.9122 2.06702 14.7559 1.91074C14.5996 1.75446 14.3877 1.66667 14.1667 1.66667ZM7.5 7.5C7.7124 7.50024 7.91669 7.58157 8.07114 7.72737C8.22559 7.87318 8.31853 8.07246 8.33098 8.2845C8.34342 8.49653 8.27444 8.70532 8.13811 8.86819C8.00179 9.03107 7.80841 9.13575 7.5975 9.16083L7.5 9.16667H5C4.7876 9.16643 4.58331 9.0851 4.42886 8.93929C4.27441 8.79349 4.18147 8.59421 4.16902 8.38217C4.15658 8.17014 4.22556 7.96135 4.36189 7.79847C4.49821 7.6356 4.69159 7.53092 4.9025 7.50583L5 7.5H7.5ZM11.6667 4.16667C11.8877 4.16667 12.0996 4.25446 12.2559 4.41074C12.4122 4.56703 12.5 4.77899 12.5 5C12.5 5.22101 12.4122 5.43298 12.2559 5.58926C12.0996 5.74554 11.8877 5.83333 11.6667 5.83333H5C4.77899 5.83333 4.56702 5.74554 4.41074 5.58926C4.25446 5.43298 4.16667 5.22101 4.16667 5C4.16667 4.77899 4.25446 4.56703 4.41074 4.41074C4.56702 4.25446 4.77899 4.16667 5 4.16667H11.6667Z"
                                    fill="#09244B"
                                  />
                                </svg>
                              </button>
                              <button className="hover:text-[#7B00D4]">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === "Expenses" && (
          <div className="space-y-6">
            <div className="w-full relative">
              <ChartCard
                title="Expenses Trend"
                variant="line"
                data={expensesTrendData}
                xKey="label"
                yKey="value"
                color={BRAND.purple}
                lineType="monotone"
                headerFilterLabel="Go to Expenses"
                onHeaderFilterClick={() => {}}
              />
            </div>

            {/* Top Expenses Table */}
            <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden">
              <div className="p-5 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-base font-semibold text-[#3C3C3C]">
                  Top Expenses
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search advance request"
                      className="pl-10 pr-4 py-2 w-full sm:w-64 rounded-[4px] border border-neutral-200 bg-neutral-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-[4px] border border-neutral-200 bg-white text-sm text-[#3C3C3C] hover:bg-neutral-50">
                      All categories{" "}
                      <ChevronDown className="h-4 w-4 text-[#3C3C3C]" />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-[4px] border border-neutral-200 bg-white text-sm text-[#3C3C3C] hover:bg-neutral-50">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      All artists{" "}
                      <ChevronDown className="h-4 w-4 text-[#3C3C3C]" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[#3C3C3C] font-medium bg-neutral-50">
                    <tr>
                      <th className="px-6 py-4 font-medium">ID</th>
                      <th className="px-6 py-4 font-medium flex items-center gap-1">
                        Date{" "}
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m7 15 5 5 5-5" />
                          <path d="m7 9 5-5 5 5" />
                        </svg>
                      </th>
                      <th className="px-6 py-4 font-medium">Artist Name</th>
                      <th className="px-6 py-4 font-medium">Category</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEAEA] text-base">
                    {topExpensesData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-20">
                          <div className="flex flex-col items-center justify-center text-center">
                            <Table2 className="h-5 w-5 text-[#7B00D4]" />
                            <p className="mt-2 text-sm font-medium text-neutral-700">
                              No records yet
                            </p>
                            <p className="mt-1 max-w-xs text-xs text-[#3C3C3C]">
                              Entries will appear here once financial data is
                              added by your label.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pagedTopExpensesData.map((expense, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50/50">
                          <td className="px-6 py-4 text-[#3C3C3C] ">
                            {expense.id}
                          </td>
                          <td className="px-6 py-4 text-[#3C3C3C]">
                            {expense.date}
                          </td>
                          <td className="px-6 py-4 text-[#3C3C3C]">
                            {expense.artist}
                          </td>
                          <td className="px-6 py-4 text-[#3C3C3C]">
                            {expense.category}
                          </td>
                          <td className="px-6 py-4">
                            <StatusPill label={expense.status} />
                          </td>
                          <td className="px-6 py-4 text-[#3C3C3C] ">
                            {expense.amount}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={expensesPage}
                totalPages={expensesTotalPages}
                onChange={setExpensesPage}
              />
            </div>
          </div>
        )}
      </div>

      <UploadFileModal
        isOpen={openUpload}
        onClose={() => setOpenUpload(false)}
        showArtistSelect
        artistOptions={recordLabelArtistOptions}
        onUpload={handleUpload}
      />
      <AddAdvanceModal
        open={openAdvance}
        onClose={() => setOpenAdvance(false)}
        onSubmit={handleAddAdvance}
      />
      <AddExpensesModal
        open={openExpense}
        onClose={() => setOpenExpense(false)}
        recordLabelFields
        artistOptions={recordLabelArtistOptions}
        onSubmit={handleAddExpense}
      />
      <UnrecognizedArtistsModal
        isOpen={openUnrecognizedModal}
        onClose={() => setOpenUnrecognizedModal(false)}
        unrecognizedNames={pendingUnmatchedArtists}
        systemArtists={recordLabelArtists}
        onFinish={handleResolveUnrecognizedArtists}
        onIgnore={handleIgnoreFromModal}
      />
      <IgnoreUnrecognizedConfirmModal
        open={openIgnoreConfirm}
        onClose={() => setOpenIgnoreConfirm(false)}
        onConfirm={handleConfirmIgnore}
      />
    </div>
  );
}
