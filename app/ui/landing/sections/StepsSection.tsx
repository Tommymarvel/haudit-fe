'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Container } from '../Container';

const STEPS = [
  {
    title: 'Step 1',
    body: 'Import. Drag and drop CSV statements from any distributor.',
    image: '/landing/steps/concert-photo.jpg',
  },
  {
    title: 'Step 2',
    body: 'Verify. Log expenses with attached receipts for approval.',
    image: '/landing/roles/solo-artist.jpg',
  },
  {
    title: 'Step 3',
    body: 'Track. Watch the Advance-o-Meter update as royalties pay down investments.',
    image: '/landing/roles/labels-company.jpg',
  },
];

export function StepsSection() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    function onScroll() {
      const el = wrapperRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollableHeight = rect.height - vh;
      if (scrollableHeight <= 0) return;

      const scrolled = Math.min(Math.max(-rect.top, 0), scrollableHeight);
      const progress = scrolled / scrollableHeight;
      const step = Math.min(
        STEPS.length - 1,
        Math.floor(progress * STEPS.length)
      );
      setActive(step);
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="bg-white">
      <Container className="flex flex-col items-center gap-4 pt-[120px] text-center">
        <h2 className="max-w-[618px] font-[family-name:var(--font-landing-manrope)] text-3xl font-medium capitalize text-[#101010] sm:text-4xl lg:text-[44px] lg:leading-[52px]">
          From raw data to &quot;recouped&quot; in 3 steps.
        </h2>
        <p className="max-w-[494px] font-[family-name:var(--font-landing-manrope)] text-base text-[#101010]/50">
          From artists to record labels, Haudit brings performance and
          financial clarity into one dashboard.
        </p>
      </Container>

      <div ref={wrapperRef} className="relative" style={{ height: `${STEPS.length * 100}vh` }}>
        <div className="sticky top-0 flex h-screen items-center bg-white">
          <Container className="flex w-full flex-col items-center gap-10 lg:flex-row lg:items-stretch lg:justify-center">
            <div className="flex w-full max-w-[358px] gap-6">
              <div className="relative w-[3px] shrink-0 rounded-full bg-[#101010]/10">
                <div
                  className="absolute left-0 top-0 w-full rounded-full bg-[#101010] transition-[height] duration-500 ease-out"
                  style={{ height: `${((active + 1) / STEPS.length) * 100}%` }}
                />
              </div>
              <div className="flex flex-1 flex-col justify-between gap-8">
                {STEPS.map((step, i) => (
                  <div
                    key={step.title}
                    className={`flex flex-col gap-2 transition-opacity duration-500 ${
                      i === active ? 'opacity-100' : 'opacity-40'
                    }`}
                  >
                    <p className="font-[family-name:var(--font-landing-manrope)] text-xl text-[#101010]">
                      {step.title}
                    </p>
                    <p className="font-[family-name:var(--font-landing-inter)] text-base leading-6 text-[#101010]/50">
                      {step.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative aspect-square w-full max-w-[400px] shrink-0 overflow-hidden rounded-2xl">
              {STEPS.map((step, i) => (
                <Image
                  key={step.image}
                  src={step.image}
                  alt={step.title}
                  fill
                  className={`object-cover transition-opacity duration-500 ${
                    i === active ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ))}
              <div
                className={`absolute bottom-4 right-4 w-[60%] max-w-[238px] transition-opacity duration-500 ${
                  active === 0 ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <Image
                  src="/landing/steps/streams-card.svg"
                  alt="Streams per DSP: 4,340 total streams"
                  width={238}
                  height={171}
                  className="h-auto w-full"
                />
              </div>
            </div>
          </Container>
        </div>
      </div>
    </div>
  );
}
