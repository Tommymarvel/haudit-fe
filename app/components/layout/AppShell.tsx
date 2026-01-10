'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import Image from 'next/image';
import Sidebar from './Sidebar';
import { cn } from '@/lib/cn';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    // FLEX ROW at all sizes, not block/grid (prevents stacking)
    <div className="h-screen flex bg-neutral-100 overflow-hidden">
      {/* Sidebar: fixed width, don't shrink, fixed position */}
      <aside className="hidden md:flex w-[23%] shrink-0 h-screen overflow-y-auto">
        <Sidebar />
      </aside>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 md:hidden',
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Sidebar Slide-in */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[80%] bg-white shadow-xl transition-transform duration-300 ease-in-out md:hidden',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar />
      </div>

      {/* Content column - scrollable */}
      <div className="flex min-w-0 flex-1 flex-col bg-white h-screen overflow-y-auto">
        {/* Mobile Header */}
        <div className="flex items-center gap-3 p-4 md:hidden border-b border-neutral-100 sticky top-0 bg-white z-30">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 text-neutral-600"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-end gap-2">
             <div className=" rounded-l grid place-items-center">
                <Image src="/haudit-logo.svg" alt="Haudit" width={24} height={24} />
             </div>
             <span className="text-xl font-bold text-[#3C3C3C]">Haudit</span>
          </div>
        </div>
        <div className="p-2 lg:p-6 ">{children}</div>
      </div>
    </div>
  );
}
