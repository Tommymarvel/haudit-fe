import Image from 'next/image';
import { Container } from '../Container';
import { LandingButton } from '../Button';

export function FeatureBlock({
  bgColor,
  title,
  description,
  ctaLabel,
  checklist,
  mockupSrc,
  mockupAlt,
  mockupWidth,
  mockupHeight,
  index = 0,
}: {
  bgColor: string;
  title: string;
  description: string;
  ctaLabel: string;
  checklist: string[];
  mockupSrc: string;
  mockupAlt: string;
  mockupWidth: number;
  mockupHeight: number;
  index?: number;
}) {
  return (
    <div
      style={{ backgroundColor: bgColor, top: index * 140, zIndex: 10 + index }}
      className="sticky flex min-h-screen flex-col justify-center py-[90px]"
    >
      <Container className="flex flex-col gap-6">
        <div className="flex flex-col items-start gap-20 lg:flex-row lg:items-center">
          <div className="flex w-full max-w-[687px] flex-col items-start gap-4">
            <h3 className="font-[family-name:var(--font-landing-inter)] text-2xl font-medium capitalize text-[#101010] sm:text-[32px]">
              {title}
            </h3>
            <p className="font-[family-name:var(--font-landing-inter)] text-base leading-6 text-[#101010]/50">
              {description}
            </p>
            <LandingButton href="/signup" className="h-11 rounded-lg px-3 py-3 text-base">
              {ctaLabel}
            </LandingButton>
          </div>

          <div className="flex w-full flex-1 flex-col items-start gap-2">
            {checklist.map((item) => (
              <div key={item} className="flex w-full items-center gap-2">
                <Image
                  src="/landing/features/check-circle.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="shrink-0"
                />
                <p className="flex-1 font-[family-name:var(--font-landing-inter)] text-base leading-6 text-[#101010]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full overflow-hidden rounded-2xl">
          <Image
            src={mockupSrc}
            alt={mockupAlt}
            width={mockupWidth}
            height={mockupHeight}
            className="h-auto w-full"
          />
        </div>
      </Container>
    </div>
  );
}
