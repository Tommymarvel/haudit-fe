import Image from 'next/image';
import { Container } from '../Container';

export function ClientLogos() {
  return (
    <Container className="flex flex-col items-center gap-20 bg-white py-24">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="max-w-[608px] font-[family-name:var(--font-landing-manrope)] text-3xl font-medium capitalize text-[#010101] sm:text-4xl lg:text-[44px] lg:leading-[52px]">
          We Support royalties from top Distributors
        </h2>
        <p className="max-w-[708px] font-[family-name:var(--font-landing-manrope)] text-base text-[#010101]/40">
          A clear view of every distributor included in your royalty
          calculations
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-20 gap-y-6 grayscale opacity-60">
        <Image
          src="/landing/clients/cdb-logo.svg"
          alt="CD Baby"
          width={84}
          height={55}
        />
        <Image
          src="/landing/clients/ditto.svg"
          alt="Ditto Music"
          width={98}
          height={50}
        />
        <Image
          src="/landing/clients/tunecore.svg"
          alt="TuneCore"
          width={175}
          height={50}
        />
        <div className="relative h-[51px] w-[120px]">
          <Image
            src="/landing/clients/fuga-2.svg"
            alt="FUGA"
            fill
            className="object-contain"
          />
          <Image
            src="/landing/clients/fuga-1.svg"
            alt=""
            width={120}
            height={10}
            className="absolute inset-x-0 bottom-0"
          />
        </div>
        <Image
          src="/landing/clients/distrokid.png"
          alt="DistroKid"
          width={155}
          height={50}
          className="h-auto w-auto"
        />
      </div>
    </Container>
  );
}
