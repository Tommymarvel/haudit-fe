import Image from 'next/image';
import { Container } from '../Container';
import { LandingButton } from '../Button';

export function Hero() {
  return (
    <Container className="flex flex-col items-center gap-16 py-10 pb-[120px] lg:flex-row lg:items-center lg:justify-between">
      <div className="flex w-full max-w-[568px] flex-col justify-between gap-16">
        <div className="flex flex-col gap-4">
          <h1 className="font-[family-name:var(--font-landing-manrope)] text-4xl font-medium text-[#101010] sm:text-5xl lg:text-[52px]">
            Structured Finances for Music Professionals.
          </h1>
          <p className="font-[family-name:var(--font-landing-manrope)] text-base text-[#101010]/40">
            Haudit standardizes royalty management, capital advances, and
            expense workflows providing you with expert level financial
            oversight of every dollar in motion.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <LandingButton href="/signup" variant="primary" className="sm:flex-1">
              Get early access
            </LandingButton>
            <LandingButton href="#contact" variant="outline" className="sm:flex-1">
              Schedule a Consultation
            </LandingButton>
          </div>
          <p className="font-[family-name:var(--font-landing-manrope)] text-base text-[#101010]/40">
            Cancel anytime. Built by pros with 25+ years experience.
          </p>
        </div>
      </div>

      {/* Illustration cluster: desktop only, hidden on mobile to avoid overlapping the copy */}
      <div className="relative hidden h-[396px] w-full max-w-[619px] shrink-0 lg:block">
        {/* Chart mock */}
        <div className="absolute left-0 top-0 h-[189px] w-[296px] overflow-hidden rounded-2xl shadow-[var(--shadow-card)]">
          <Image
            src="/landing/hero/group1.svg"
            alt=""
            fill
            className="object-cover"
          />
        </div>

        {/* Distribution stat card */}
        <div className="absolute left-[322px] top-[43px] h-[116px] w-[191px]">
          <Image
            src="/landing/hero/hero-illustration-metrics-2.svg"
            alt="20+ Distribution Company"
            fill
          />
        </div>

        {/* Stream performance mini card with DSP icons */}
        <div className="absolute left-[106px] top-[220px] h-[116px] w-[191px] overflow-hidden">
          <Image
            src="/landing/hero/hero-illustration-distro-2.svg"
            alt="Track stream performance"
            fill
          />
          <div className="absolute inset-[10.18%_27.87%_80.86%_5.54%]">
            <Image src="/landing/hero/vector.svg" alt="" fill />
          </div>
          <div className="absolute inset-[23.72%_13.21%_61.89%_5.6%]">
            <Image src="/landing/hero/vector1.svg" alt="" fill />
          </div>
          <div className="absolute inset-[66.67%_79.73%_8.89%_5.41%]">
            <Image src="/landing/hero/vector2.svg" alt="" fill />
          </div>
          <div className="absolute inset-[66.67%_67.57%_8.89%_17.57%] size-[28px]">
            <Image src="/landing/hero/vector3.png" alt="" fill />
          </div>
          <div className="absolute inset-[66.67%_55.41%_8.89%_29.73%] size-[28px]">
            <Image src="/landing/hero/vector4.png" alt="" fill />
          </div>
          <div className="absolute inset-[66.67%_43.24%_8.89%_41.89%] size-[28px]">
            <Image src="/landing/hero/vector5.png" alt="" fill />
          </div>
          <div className="absolute inset-[66.67%_31.08%_8.89%_54.05%]">
            <Image src="/landing/hero/vector6.svg" alt="" fill />
          </div>
          <div className="absolute inset-[72.86%_33.84%_22.13%_56.66%]">
            <Image src="/landing/hero/vector7.svg" alt="" fill />
          </div>
          <div className="absolute inset-[79.72%_33.8%_13.76%_56.73%]">
            <Image src="/landing/hero/vector8.svg" alt="" fill />
          </div>
        </div>

        {/* Artist photo */}
        <div className="absolute left-[322px] top-[158px] h-[238px] w-[297px] overflow-hidden rounded-2xl">
          <Image
            src="/landing/hero/vector12.png"
            alt="Artist performing"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </Container>
  );
}
