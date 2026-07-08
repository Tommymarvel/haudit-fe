import { Container } from '../Container';
import { FeatureBlock } from './FeatureBlock';

export function Features() {
  return (
    <div id="features">
      <Container className="flex flex-col items-center py-[120px] pb-10 text-center">
        <h2 className="max-w-[708px] font-[family-name:var(--font-landing-manrope)] text-3xl font-medium capitalize text-[#101010] sm:text-4xl lg:text-[44px] lg:leading-[52px]">
          One Platform for all your Finances.
        </h2>
        <p className="mt-2 max-w-[708px] font-[family-name:var(--font-landing-manrope)] text-base text-[#101010]/50">
          Haudit collects raw revenue data and converts it into structured
          intelligence organizing capital, allocations and expenses into
          clear and secure workflows.
        </p>
      </Container>

      <FeatureBlock
        bgColor="#ead3ff"
        title="Royalty Intelligence"
        description="Haudit transforms all your revenue reports into a single, high-fidelity view of your earnings. Get instant clean, accurate insights."
        ctaLabel="Manage royalty"
        checklist={[
          'Revenue by DSP',
          'Revenue by release',
          'Split transparency',
          'Structured financial summaries',
        ]}
        mockupSrc="/landing/features/royalty-mockup.png"
        mockupAlt="Royalty analytics dashboard"
        mockupWidth={1260}
        mockupHeight={623}
        index={0}
      />

      <FeatureBlock
        bgColor="#ffdeef"
        title="Advances & Recoupment"
        description="Advances are significant capital allocations that require rigorous structure. Haudit provides a secure framework to document and monitor the lifecycle of every advance."
        ctaLabel="Start recording advance"
        checklist={[
          'Record and track advance agreements digitally.',
          'Disburse Advances through approval chains.',
          'View outstanding balances and recoupment status with total certainty',
        ]}
        mockupSrc="/landing/features/advances-mockup.png"
        mockupAlt="Advance request dashboard"
        mockupWidth={1350}
        mockupHeight={623}
        index={1}
      />

      <FeatureBlock
        bgColor="#fcb5da"
        title="Expenses & Approvals"
        description="Financial discipline requires a traceable process. Haudit replaces informal requests with a timestamped system of record."
        ctaLabel="Start recording expenses"
        checklist={[
          'Detailed, expense categorization.',
          'Every approval documented, dated, and traceable.',
          'Automated expense logging and recoupment tracking',
        ]}
        mockupSrc="/landing/features/expenses-mockup.png"
        mockupAlt="Expenses dashboard"
        mockupWidth={1260}
        mockupHeight={639}
        index={2}
      />

      {/* Gives the last sticky card scroll room to hold — a sticky element
          can't hold longer than its own containing block, and this card has
          no following sibling inside #features to borrow that room from. */}
      <div aria-hidden className="h-screen" />
    </div>
  );
}
