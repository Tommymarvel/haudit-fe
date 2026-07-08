import { Container } from '../Container';

const CARDS = [
  {
    title: 'Scattered Financial Data',
    body: 'Royalty files, expenses, and advances live in different places with no single source of truth.',
  },
  {
    title: 'Unclear Approvals',
    body: 'Decisions happen in emails and chats, leaving no clear trail or accountability.',
  },
  {
    title: 'Manual Recoupment',
    body: 'Calculations are done by hand, increasing errors and slowing financial clarity.',
  },
];

export function SolutionIntro() {
  return (
    <Container className="flex flex-col items-center gap-20 py-[120px]">
      <h2 className="max-w-[618px] text-center font-[family-name:var(--font-landing-manrope)] text-3xl font-medium capitalize text-[#101010] sm:text-4xl lg:text-[44px] lg:leading-[52px]">
        Your Royalties is at risk
      </h2>

      <div className="grid w-full grid-cols-1 gap-6 overflow-hidden rounded-2xl sm:grid-cols-3">
        {CARDS.map((card) => (
          <div
            key={card.title}
            className="flex flex-col items-start gap-2 rounded-2xl border border-black/10 p-6"
          >
            <h3 className="font-[family-name:var(--font-landing-manrope)] text-2xl capitalize text-[#101010]">
              {card.title}
            </h3>
            <p className="font-[family-name:var(--font-landing-manrope)] text-base text-[#101010]/50">
              {card.body}
            </p>
          </div>
        ))}
      </div>
    </Container>
  );
}
