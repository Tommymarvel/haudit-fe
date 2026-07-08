import Image from 'next/image';
import Link from 'next/link';
import { Container } from '../Container';

const ROLES = [
  {
    title: 'Independent (Solo) Artist',
    description: 'Operate with the structure of a professional finance team',
    ctaLabel: 'Manage royalty',
    image: '/landing/roles/solo-artist.jpg',
    rotate: '-rotate-2',
  },
  {
    title: 'Signed (Label) Artist',
    description:
      'Gain transparent visibility into earnings, advances, and approvals.',
    ctaLabel: 'Track performance',
    image: '/landing/roles/label-artist.jpg',
    rotate: '',
  },
  {
    title: 'Labels & Music Companies',
    description:
      'Manage multi-artist financial workflows with control and accountability.',
    ctaLabel: 'Manage artists',
    image: '/landing/roles/labels-company.jpg',
    rotate: 'rotate-2',
  },
];

export function Roles() {
  return (
    <Container className="flex flex-col items-center gap-20 py-[120px]" id="solutions">
      <div className="flex max-w-[618px] flex-col items-center gap-4 text-center">
        <h2 className="font-[family-name:var(--font-landing-manrope)] text-3xl font-medium capitalize text-[#101010] sm:text-4xl lg:text-[44px] lg:leading-[52px]">
          Haudit: Built For Every Role in Music
        </h2>
        <p className="font-[family-name:var(--font-landing-manrope)] text-base text-[#101010]/50">
          From artists to record labels, Haudit brings performance and
          financial clarity into one dashboard.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-3">
        {ROLES.map((role) => (
          <div
            key={role.title}
            className="flex flex-col items-start gap-6 rounded-2xl border border-black/10 p-4"
          >
            <div className="flex flex-col items-start gap-2">
              <h3 className="font-[family-name:var(--font-landing-manrope)] text-2xl capitalize text-[#101010]">
                {role.title}
              </h3>
              <p className="font-[family-name:var(--font-landing-manrope)] text-base text-[#101010]/50">
                {role.description}
              </p>
            </div>

            <Link
              href="/signup"
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#101010] px-6 text-base text-[#010101] transition hover:bg-[#101010] hover:text-white"
            >
              {role.ctaLabel}
            </Link>

            <div className={`relative aspect-square w-full overflow-hidden rounded-2xl ${role.rotate}`}>
              <Image
                src={role.image}
                alt={role.title}
                fill
                className="object-cover"
              />
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
