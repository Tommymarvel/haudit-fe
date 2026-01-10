"use client";
import React, { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/Button";
import { X, Calendar, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import AppShell from "@/components/layout/AppShell";

const NotificationIcon = ({ type }: { type: string }) => {
  const icons = {
    expense: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="#10B981"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M8 12L11 15L16 9"
          stroke="#10B981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    advance: (
      <svg
        width="38"
        height="38"
        viewBox="0 0 38 38"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g opacity="0.3">
          <rect
            x="6"
            y="6"
            width="26"
            height="26"
            rx="13"
            stroke="#079455"
            stroke-width="2"
          />
        </g>
        <g opacity="0.1">
          <rect
            x="1"
            y="1"
            width="36"
            height="36"
            rx="18"
            stroke="#079455"
            stroke-width="2"
          />
        </g>
        <g clip-path="url(#clip0_722_13212)">
          <path
            d="M15.2513 19.0003L17.7513 21.5003L22.7513 16.5003M27.3346 19.0003C27.3346 23.6027 23.6037 27.3337 19.0013 27.3337C14.3989 27.3337 10.668 23.6027 10.668 19.0003C10.668 14.398 14.3989 10.667 19.0013 10.667C23.6037 10.667 27.3346 14.398 27.3346 19.0003Z"
            stroke="#079455"
            stroke-width="1.66667"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </g>
        <defs>
          <clipPath id="clip0_722_13212">
            <rect
              width="20"
              height="20"
              fill="white"
              transform="translate(9 9)"
            />
          </clipPath>
        </defs>
      </svg>
    ),
    upload: (
   <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<g opacity="0.3">
<rect x="6" y="6" width="26" height="26" rx="13" stroke="#535862" stroke-width="2"/>
</g>
<g opacity="0.1">
<rect x="1" y="1" width="36" height="36" rx="18" stroke="#535862" stroke-width="2"/>
</g>
<path d="M12.3346 22.5352C11.3296 21.8625 10.668 20.7168 10.668 19.4167C10.668 17.4637 12.1609 15.8594 14.0678 15.6828C14.4578 13.3101 16.5182 11.5 19.0013 11.5C21.4844 11.5 23.5448 13.3101 23.9348 15.6828C25.8417 15.8594 27.3346 17.4637 27.3346 19.4167C27.3346 20.7168 26.673 21.8625 25.668 22.5352M15.668 22.3333L19.0013 19M19.0013 19L22.3346 22.3333M19.0013 19V26.5" stroke="#535862" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

    ),
  };
  return icons[type as keyof typeof icons] || icons.expense;
};

export default function NotificationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const { notifications, meta, unreadCount, markAsRead, markAllAsRead } =
    useNotifications(currentPage, 10, startDate, endDate);

  const handleApplyDates = () => {
    setCurrentPage(1);
    setShowDatePicker(false);
  };

  const handleClearDates = () => {
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
    setShowDatePicker(false);
  };

  const filteredNotifications = notifications.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDismiss = async (id: string) => {
    await markAsRead(id);
  };

  return (
    <AppShell>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between mb-6">
          <div>
            {" "}
            <h1 className="text-2xl font-semibold text-neutral-900">
              Notification
            </h1>
            <p className="text-sm text-neutral-500">
              Check all notifications here
            </p>
          </div>
          {/* Search and Date Filter */}
          <div className="mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-3 rounded-lg border border-neutral-200 bg-white text-sm outline-none focus:ring-2 focus:ring-neutral-100"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                ⌘K
              </span>
            </div>
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={cn(
                  "rounded-lg border-neutral-200 bg-white",
                  (startDate || endDate) ? "text-purple-600" : "text-neutral-400"
                )}
              >
                <Calendar className="h-4 w-4" />
                {(startDate || endDate) ? "Filtered" : "Select dates"}
              </Button>
              
              {/* Date Picker Dropdown */}
              {showDatePicker && (
                <div className="absolute right-0 top-12 z-50 w-80 rounded-lg border border-neutral-200 bg-white p-4 shadow-lg">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-100"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleApplyDates}
                        className="flex-1 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                      >
                        Apply
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleClearDates}
                        className="flex-1 rounded-lg border-neutral-200"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              className={cn(
                "relative flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-4 transition-colors",
                !notification.is_read && "bg-purple-50/50"
              )}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-1">
                <NotificationIcon type={notification.type} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                  {notification.title}
                </h3>
                <p className="text-sm text-neutral-600 mb-3">
                  {notification.description}
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleDismiss(notification._id)}
                    className="text-sm text-neutral-600 hover:text-neutral-900 font-medium"
                  >
                    Dismiss
                  </button>
                  {/* <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                  View changes
                </button> */}
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={() => handleDismiss(notification._id)}
                className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}

          {filteredNotifications.length === 0 && (
            <div className="text-center py-12 text-neutral-500">
              {searchQuery ? "No notifications found" : "No notifications yet"}
            </div>
          )}
        </div>

        {/* Mark all as read button */}
        {unreadCount > 0 && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={markAllAsRead}
              className="rounded-lg border-neutral-200"
            >
              Mark all as read ({unreadCount})
            </Button>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-neutral-200 pt-4">
            <p className="text-sm text-neutral-600">
              Showing {((meta.page - 1) * meta.limit) + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} notifications
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={meta.page === 1}
                className="rounded-lg border-neutral-200"
              >
                Previous
              </Button>
              
              {/* Page numbers */}
              <div className="flex gap-1">
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "h-10 w-10 rounded-lg text-sm font-medium transition-colors",
                      page === meta.page
                        ? "bg-purple-600 text-white"
                        : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(meta.totalPages, prev + 1))}
                disabled={meta.page === meta.totalPages}
                className="rounded-lg border-neutral-200"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
