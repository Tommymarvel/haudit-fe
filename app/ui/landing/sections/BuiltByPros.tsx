import { Container } from '../Container';

export function BuiltByPros() {
  return (
    <div className="bg-[#101010] py-[120px]">
      <Container className="flex flex-col items-center gap-4 text-center">
        <h2 className="font-[family-name:var(--font-landing-manrope)] text-3xl font-medium capitalize text-white sm:text-4xl lg:text-[52px] lg:leading-[52px]">
          <span className="block text-white/70">
            Built by professionals with over
          </span>
          <span className="block">25 years in the music business.</span>
        </h2>
        <p className="max-w-[494px] font-[family-name:var(--font-landing-manrope)] text-base capitalize text-white">
          After decades of watching royalty disputes, unclear approvals, and
          recoupment misunderstandings, we engineered a system designed for
          operational clarity.
        </p>
      </Container>
    </div>
  );
}
