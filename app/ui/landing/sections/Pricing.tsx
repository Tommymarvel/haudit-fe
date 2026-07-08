import Link from 'next/link';
import { Container } from '../Container';

const TIERS = [
  {
    badge: 'Independent Artist',
    title: 'For Self-Managed Artists',
    titleItalic: 'Tracking Their Own Royalties.',
    price: '$XX',
    priceSuffix: '/ Month',
    ctaLabel: 'Start trial',
    features: ['1 Artist Profile', 'Unlimited CSV Uploads', 'Expense Logging'],
    highlighted: false,
  },
  {
    badge: 'Label & Manager',
    title: 'For Teams Managing Multiple',
    titleItalic: 'Rosters and Expense Accounts.',
    price: '$XX',
    priceSuffix: '/ Month',
    ctaLabel: 'Start trial',
    features: [
      'Unlimited Artist Profiles',
      'Approval Workflows',
      'Team Access (Accountant, A&R)',
    ],
    highlighted: true,
  },
  {
    badge: 'Enterprise',
    title: 'For Large Catalogs Requiring',
    titleItalic: 'Migration and API Support.',
    price: 'Custom',
    priceSuffix: '',
    ctaLabel: 'Contact sales',
    features: ['Get All Access', 'Custom Settings', 'Personalized Features'],
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <Container className="flex flex-col items-center gap-20 py-[120px]">
      <div className="flex max-w-[618px] flex-col items-center gap-4 text-center">
        <h2 className="font-[family-name:var(--font-landing-manrope)] text-3xl font-medium capitalize text-[#101010] sm:text-4xl lg:text-[44px] lg:leading-[52px]">
          Haudit Brings Clarity to Your Revenue
        </h2>
        <p className="font-[family-name:var(--font-landing-manrope)] text-base text-[#101010]/50">
          Bring disciplined financial workflows to your revenue operations.
          Ensure your growth is supported by a professional system of record.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-3">
        {TIERS.map((tier) => (
          <div
            key={tier.badge}
            className={
              tier.highlighted
                ? 'flex flex-col rounded-2xl bg-[#ead3ff] p-3 pt-0'
                : 'flex flex-col'
            }
          >
            {tier.highlighted && (
              <p className="py-3 text-center font-[family-name:var(--font-landing-inter)] text-sm text-[#451e5f]">
                Most Popular
              </p>
            )}
            <div className="flex flex-col gap-6 rounded-2xl bg-[#101010] p-6">
              <span className="w-fit rounded-full border border-white/20 px-3 py-1 font-[family-name:var(--font-landing-inter)] text-sm text-white">
                {tier.badge}
              </span>
              <h3 className="font-[family-name:var(--font-landing-manrope)] text-2xl text-white">
                {tier.title} <em className="italic">{tier.titleItalic}</em>
              </h3>
              <p className="font-[family-name:var(--font-landing-manrope)] text-white">
                <span className="text-2xl font-bold">{tier.price}</span>{' '}
                {tier.priceSuffix && (
                  <span className="text-base text-white/70">
                    {tier.priceSuffix}
                  </span>
                )}
              </p>
              <Link
                href="/signup"
                className="inline-flex h-11 w-fit items-center justify-center rounded-full border border-white px-6 font-[family-name:var(--font-landing-inter)] text-base text-white transition hover:bg-white hover:text-[#101010]"
              >
                {tier.ctaLabel}
              </Link>
            </div>
            <ul className="flex flex-col gap-3 rounded-b-2xl bg-[#f4f4f4] p-6">
              {tier.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 font-[family-name:var(--font-landing-inter)] text-base text-[#101010]"
                >
                  <span className="size-1.5 shrink-0 rounded-full bg-[#101010]" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Container>
  );
}
