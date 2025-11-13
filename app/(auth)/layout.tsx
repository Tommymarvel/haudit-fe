'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import SideImage from '../assets/auth-side-image.png';
import Whoareyou from '../assets/whoareyou.png';
import { usePathname } from 'next/navigation';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isWhoAreYou = pathname === '/whoareyou';

  return (
    <main className="bg-white min-h-dvh lg:grid lg:grid-cols-[43%_57%]">
      {/* Left: content (only this scrolls) */}
      <section
        className="
          h-[100svh]            /* real viewport height */
          overflow-y-auto       /* this is the only scroller */
          px-6
          py-10            /* big vertical breathing room */
          flex flex-col         /* stop vertical 'shortening' from items-center */
          justify-start
                /* start at top; will scroll as needed */
      "
      >
        <div className="w-full mt-20  xl:max-w-[60%]  mx-auto">{children}</div>
      </section>

      {/* Right: static/sticky marketing image */}
      <aside
        className="
          hidden lg:block
          sticky top-0
          h-[100svh]
          bg-violet-50
                       /* required for next/image fill */
      "
      >
        <Image
          src={isWhoAreYou ? Whoareyou : SideImage}
          alt={
            isWhoAreYou
              ? 'Who are you illustration'
              : 'Haudit dashboard preview'
          }
          fill
          className="object-cover" /* shows entire artwork; change to object-cover for full-bleed */
          priority
        />
      </aside>
    </main>
  );
}
