import Image from 'next/image';
import Link from 'next/link';
import { Container } from '../Container';
import { LandingButton } from '../Button';

const LINK_COLUMNS = [
  {
    heading: 'Company',
    links: ['Blog', 'FAQs', 'Glossary', 'Partner with us'],
  },
  {
    heading: 'Legal',
    links: ['Terms of use', 'Privacy policy', 'Refund policy', 'Cookie Notice'],
  },
  {
    heading: 'Socials',
    links: ['Terms of use', 'Privacy policy', 'Refund policy', 'Cookie Notice'],
  },
];

export function Footer() {
  return (
    <div className="bg-[#f4f4f4] pb-0 pt-[120px]">
      <Container className="flex flex-col gap-[120px]">
        <div className="flex flex-col items-center gap-10 overflow-hidden rounded-2xl bg-white p-6 lg:flex-row lg:justify-between lg:p-10">
          <div className="flex max-w-[471px] flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="font-[family-name:var(--font-landing-manrope)] text-3xl font-medium text-[#101010] sm:text-4xl">
                Take Control of Your Music Data
              </h2>
              <p className="font-[family-name:var(--font-landing-inter)] text-base text-[#101010]/50">
                Start tracking performance, royalties, advances, and expenses
                in one place.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <LandingButton href="/signup" variant="primary" className="h-11">
                Get Started
              </LandingButton>
              <LandingButton href="#contact" variant="outline" className="h-11">
                Schedule a Consultation
              </LandingButton>
            </div>
          </div>

          <div className="relative h-[300px] w-[300px] shrink-0">
            <Image
              src="/landing/footer/music-collage.png"
              alt=""
              fill
              className="object-contain"
            />
          </div>
        </div>

        <div className="flex flex-col gap-16 lg:flex-row lg:justify-between">
          <div className="flex max-w-[319px] flex-col gap-4">
            <Image
              src="/landing/hero/logo.png"
              alt="Haudit"
              width={100}
              height={18}
              className="h-[18px] w-auto"
            />
            <p className="font-[family-name:var(--font-landing-inter)] text-base text-[#101010]/50">
              Start tracking performance, royalties, advances, and expenses in
              one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-16">
            {LINK_COLUMNS.map((col) => (
              <div key={col.heading} className="flex flex-col gap-6">
                <p className="font-[family-name:var(--font-landing-inter)] text-base text-[#101010]">
                  {col.heading}
                </p>
                <div className="flex flex-col gap-6">
                  {col.links.map((label, i) => (
                    <Link
                      key={`${col.heading}-${label}-${i}`}
                      href="#"
                      className="font-[family-name:var(--font-landing-inter)] text-base text-[#101010]/50 hover:text-[#101010]"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex max-w-[380px] flex-col gap-4">
            <p className="font-[family-name:var(--font-landing-inter)] text-base text-[#101010]">
              Subscribe
            </p>
            <p className="font-[family-name:var(--font-landing-inter)] text-base text-[#101010]/50">
              Subscribe to get the latest updates.
            </p>
            <form className="flex items-center justify-between gap-2 rounded-full border border-[#101010]/20 py-2 pl-4 pr-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-transparent font-[family-name:var(--font-landing-inter)] text-base text-[#101010] outline-none placeholder:text-[#101010]/40"
              />
              <button
                type="submit"
                className="shrink-0 whitespace-nowrap rounded-full bg-[#451e5f] px-4 py-2 font-[family-name:var(--font-landing-inter)] text-base text-white"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </Container>

      <div className="relative h-[200px] w-full sm:h-[260px]">
        <Image
          src="/landing/footer/crowd.png"
          alt=""
          fill
          className="object-cover object-top"
        />
      </div>
    </div>
  );
}
