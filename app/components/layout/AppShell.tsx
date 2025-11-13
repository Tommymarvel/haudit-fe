import type { ReactNode } from 'react';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    // FLEX ROW at all sizes, not block/grid (prevents stacking)
    <div className="h-screen flex bg-neutral-100 overflow-hidden">
      {/* Sidebar: fixed width, don't shrink, fixed position */}
      <aside className="hidden md:flex w-[331px] shrink-0 h-screen overflow-y-auto">
        <Sidebar />
      </aside>

      {/* Mobile: sidebar hidden, content full-width */}
      <div className="md:hidden w-0" aria-hidden />

      {/* Content column - scrollable */}
      <div className="flex min-w-0 flex-1 flex-col bg-white h-screen overflow-y-auto">
        <div className="p-6 ">{children}</div>
      </div>
    </div>
  );
}
