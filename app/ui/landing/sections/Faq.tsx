'use client';

import { useState } from 'react';
import { PlusCircle, MinusCircle } from 'lucide-react';
import { Container } from '../Container';

const FAQS = [
  {
    question: 'What is Haudit?',
    answer:
      'Haudit is a royalty auditing platform that helps artists, labels, and publishers ensure they are being paid correctly. It identifies missing payments, unusual amounts. It allows you to track artistes advances and expenses related to your music.',
  },
  {
    question: 'Who can use Haudit?',
    answer:
      'Haudit is built for independent artists, signed artists, managers, and record labels who need clear visibility into royalties, advances, and expenses.',
  },
  {
    question: 'How does Haudit work?',
    answer:
      'Upload your revenue statements from any distributor and Haudit standardizes the data into a single, structured view of your earnings, advances, and expenses.',
  },
  {
    question: 'How do I create a Haudit account?',
    answer:
      'Click "Start Your 14-Day Trial" at the top of this page and follow the signup flow to create your account in minutes.',
  },
  {
    question: 'What data do I need to provide?',
    answer:
      'You just need your royalty statements or CSV exports from your distributor, along with any expense receipts you want to log for approval.',
  },
  {
    question: 'Is my data safe?',
    answer:
      'Yes. Your financial data is encrypted in transit and at rest, and access is restricted to your account and the collaborators you invite.',
  },
  {
    question: 'Can I connect Haudit directly to my DSP accounts?',
    answer:
      'Haudit currently works from the revenue reports your distributor provides. Direct DSP integrations are on our roadmap.',
  },
  {
    question: 'Can Haudit track advances?',
    answer:
      'Yes. Haudit lets you record advance agreements, disburse them through approval chains, and monitor outstanding balances as royalties recoup them.',
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Container className="flex flex-col items-center gap-20 bg-white py-[120px]" id="faq">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="max-w-[708px] font-[family-name:var(--font-landing-manrope)] text-3xl font-medium capitalize text-[#101010] sm:text-4xl lg:text-[44px] lg:leading-[68px]">
          Frequently asked questions
        </h2>
        <p className="max-w-[708px] font-[family-name:var(--font-landing-inter)] text-base text-[#010101]/40">
          Explore our FAQs for answers to common questions about our services
          and policies.
        </p>
      </div>

      <div className="flex w-full max-w-3xl flex-col gap-8">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={faq.question}
              className={index > 0 ? 'flex flex-col gap-1 border-t border-[#e9eaeb] pt-6' : 'flex flex-col gap-1'}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-start justify-between gap-4 text-left"
              >
                <span className="font-[family-name:var(--font-landing-manrope)] text-base text-[#181d27]">
                  {faq.question}
                </span>
                <span className="shrink-0 text-[#a4a7ae]">
                  {isOpen ? <MinusCircle size={24} /> : <PlusCircle size={24} />}
                </span>
              </button>
              {isOpen && (
                <p className="font-[family-name:var(--font-landing-inter)] text-base leading-6 text-[#535862]">
                  {faq.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Container>
  );
}
