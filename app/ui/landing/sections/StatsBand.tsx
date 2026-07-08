import Image from 'next/image';
import { Container } from '../Container';

const STATS = [
  { value: '$X+', label: 'Royalties Tracked' },
  { value: 'X,000+', label: 'Reports Processed' },
  { value: '$X', label: 'Recovered for Artists & Labels' },
  { value: 'X%', label: 'Faster Reporting' },
];

export function StatsBand() {
  return (
    <div
      className="relative overflow-hidden py-[120px]"
      style={{
        backgroundImage:
          'linear-gradient(180deg, #101010 0%, #451e5f 25%, #8139b6 50%, #451e5f 75%, #101010 100%)',
      }}
    >
      <Container className="relative flex flex-col gap-16">
        <div className="grid grid-cols-2 gap-8 text-center sm:grid-cols-4 sm:text-left">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-4 sm:items-start">
              <p className="font-[family-name:var(--font-landing-manrope)] text-4xl text-white lg:text-[52px] lg:leading-[52px]">
                {stat.value}
              </p>
              <p className="font-[family-name:var(--font-landing-inter)] text-base text-white/70">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="relative mx-auto h-[380px] w-[280px] sm:h-[551px] sm:w-[406px]">
          <Image
            src="/landing/stats/music-note.png"
            alt=""
            fill
            className="object-contain"
          />
        </div>
      </Container>
    </div>
  );
}
