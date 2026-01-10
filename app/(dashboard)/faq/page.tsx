'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Minus, Search } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import gsap from 'gsap';

const FAQS = {
    'All': [
        {
            question: 'What is Haudit?',
            answer: 'Haudit is a royalty auditing platform that helps artists, labels, and publishers ensure they are being paid correctly. It identifies missing payments, unusual amounts. It allows you to track artistes advances and expenses related to your music.',
        },
        {
            question: 'Who can use Haudit?',
            answer: 'Independent artists, record labels, music publishers, and rights administrators who want to verify royalties and manage their music-related finances.',
        },
        {
            question: 'How does Haudit work?',
            answer: 'You upload your royalty statements to Haudit. The platform analyzes your data, flags missing or unusual payments, and allows you to track advances and expenses.',
        },
        {
            question: 'How do I create a Haudit account?',
            answer: 'Sign up on Haudit\'s website, provide your basic info, and upload your royalty statements.',
        },
        {
            question: 'What data do I need to provide?',
            answer: 'Your royalty statements, and your advance or expense records to fully track your financials.',
        },
        {
            question: 'Is my data safe?',
            answer: 'Yes. Haudit uses secure, encrypted storage to protect your data.',
        },
        {
            question: 'Can I connect Haudit directly to my DSP accounts?',
            answer: 'Not yet. Currently, you can only upload royalty statements gotten from respective DSP\'s manually.',
        },
        {
            question: 'Can Haudit track advances?',
            answer: 'Yes. You can record advances in Haudit and track how they are recouped over time.',
        },
        {
            question: 'Can Haudit track expenses?',
            answer: 'Yes. You can log expenses related to your music projects, helping you understand net earnings.',
        },
        {
            question: 'How often should I run an audit?',
            answer: 'Many users audit quarterly, biannually, or whenever new royalty statements arrive.',
        },
        {
            question: 'What kinds of discrepancies does Haudit detect?',
            answer: 'Haudit flags missing payments, underpayments, or unusual amounts that don\'t match expected revenue.',
        },
        {
            question: 'Can I download reports?',
            answer: 'Yes. Haudit generates detailed audit ready reports in PDF or CSV format for your records or to submit to distributors if needed.',
        },
        {
            question: 'Can Haudit help me recover missing royalties?',
            answer: 'Haudit provides detailed evidence that you can use to claim missing payments, but actual recovery is done directly with your distributor or label.',
        },
        {
            question: 'How long does an audit take?',
            answer: 'Depending on your catalog size, audits usually take a few minutes after uploading statements.',
        },
        {
            question: 'Who do I contact if I find a problem?',
            answer: 'Haudit\'s support team is available via our social media handles or email. Submit your issue along with your audit report for faster assistance.',
        },
        {
            question: 'Are there tutorials?',
            answer: 'Yes. Haudit provides onboarding guides and video tutorials to help you upload statements, track advances and expenses, and interpret your reports.',
        },
    ],
    'General': [
        {
            question: 'What is Haudit?',
            answer: 'Haudit is a royalty auditing platform that helps artists, labels, and publishers ensure they are being paid correctly. It identifies missing payments, unusual amounts. It allows you to track artistes advances and expenses related to your music.',
        },
        {
            question: 'Who can use Haudit?',
            answer: 'Independent artists, record labels, music publishers, and rights administrators who want to verify royalties and manage their music-related finances.',
        },
        {
            question: 'How does Haudit work?',
            answer: 'You upload your royalty statements to Haudit. The platform analyzes your data, flags missing or unusual payments, and allows you to track advances and expenses.',
        },
    ],
    'Account & Setup': [
        {
            question: 'How do I create a Haudit account?',
            answer: 'Sign up on Haudit\'s website, provide your basic info, and upload your royalty statements.',
        },
        {
            question: 'What data do I need to provide?',
            answer: 'Your royalty statements, and your advance or expense records to fully track your financials.',
        },
        {
            question: 'Is my data safe?',
            answer: 'Yes. Haudit uses secure, encrypted storage to protect your data.',
        },
    ],
    'Using Haudit': [
        {
            question: 'Can I connect Haudit directly to my DSP accounts?',
            answer: 'Not yet. Currently, you can only upload royalty statements gotten from respective DSP\'s manually.',
        },
        {
            question: 'Can Haudit track advances?',
            answer: 'Yes. You can record advances in Haudit and track how they are recouped over time.',
        },
        {
            question: 'Can Haudit track expenses?',
            answer: 'Yes. You can log expenses related to your music projects, helping you understand net earnings.',
        },
        {
            question: 'How often should I run an audit?',
            answer: 'Many users audit quarterly, biannually, or whenever new royalty statements arrive.',
        },
        {
            question: 'What kinds of discrepancies does Haudit detect?',
            answer: 'Haudit flags missing payments, underpayments, or unusual amounts that don\'t match expected revenue.',
        },
    ],
    'Reports & Actions': [
        {
            question: 'Can I download reports?',
            answer: 'Yes. Haudit generates detailed audit ready reports in PDF or CSV format for your records or to submit to distributors if needed.',
        },
        {
            question: 'Can Haudit help me recover missing royalties?',
            answer: 'Haudit provides detailed evidence that you can use to claim missing payments, but actual recovery is done directly with your distributor or label.',
        },
        {
            question: 'How long does an audit take?',
            answer: 'Depending on your catalog size, audits usually take a few minutes after uploading statements.',
        },
    ],
    'Support': [
        {
            question: 'Who do I contact if I find a problem?',
            answer: 'Haudit\'s support team is available via our social media handles or email. Submit your issue along with your audit report for faster assistance.',
        },
        {
            question: 'Are there tutorials?',
            answer: 'Yes. Haudit provides onboarding guides and video tutorials to help you upload statements, track advances and expenses, and interpret your reports.',
        },
    ],
};

function FAQItem({ faq, isOpen, onClick }: {
    faq: { question: string; answer: string };
    isOpen: boolean;
    onClick: () => void;
}) {
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentRef.current) {
            if (isOpen) {
                // Opening animation
                gsap.fromTo(
                    contentRef.current,
                    {
                        height: 0,
                        opacity: 0,
                    },
                    {
                        height: 'auto',
                        opacity: 1,
                        duration: 0.5,
                        ease: 'power2.out',
                    }
                );
            } else {
                // Closing animation
                gsap.to(contentRef.current, {
                    height: 0,
                    opacity: 0,
                    duration: 0.4,
                    ease: 'power2.in',
                });
            }
        }
    }, [isOpen]);

    return (
        <div className="border-b border-neutral-200 py-5">
            <button
                onClick={onClick}
                className="flex justify-between items-start gap-4 w-full text-left"
            >
                <h2 className="text-base font-medium text-black flex-1">
                    {faq.question}
                </h2>
                <span
                    className="flex-shrink-0 w-6 h-6 rounded-full border border-neutral-300 flex items-center justify-center hover:bg-neutral-50 transition-colors"
                    aria-hidden="true"
                >
                    {isOpen ? (
                        <Minus className="h-3.5 w-3.5 text-neutral-600" />
                    ) : (
                        <Plus className="h-3.5 w-3.5 text-neutral-600" />
                    )}
                </span>
            </button>
            <div
                ref={contentRef}
                style={{
                    height: isOpen ? 'auto' : 0,
                    opacity: isOpen ? 1 : 0,
                    overflow: 'hidden',
                }}
            >
                <p className="mt-3 text-sm text-neutral-600 leading-relaxed pr-10">
                    {faq.answer}
                </p>
            </div>
        </div>
    );
}

export default function FAQPage() {
    const [openIndex, setOpenIndex] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');

    const tabs = ['All', 'General', 'Account & Setup', 'Using Haudit', 'Reports & Actions', 'Support'];

    const filteredFAQs = FAQS[activeTab as keyof typeof FAQS].filter(
        (faq) =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AppShell>
            <div className="max-w-[768px] mx-auto px-4 py-8">
                <div className="space-y-8">
                    {/* Header - Centered */}
                    <div className="text-center space-y-4">
                        <h1 className="text-3xl font-semibold text-black">Frequently asked questions</h1>
                        <p className="text-sm text-neutral-500">
                            Explore our FAQs for answers to common questions about our services and policies.
                        </p>

                        {/* Search Box - Centered */}
                        <div className="flex justify-center mt-6">
                            <div className="relative w-full max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                <input
                                    type="text"
                                    placeholder="Search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-16 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-medium">
                                    ⌘K
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-neutral-200">
                        <div className="flex gap-6 overflow-x-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        setActiveTab(tab);
                                        setOpenIndex(0);
                                    }}
                                    className={`pb-3 px-1 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                                        activeTab === tab
                                            ? 'border-[#7B00D4] text-[#7B00D4]'
                                            : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* FAQ list with GSAP animations */}
                    <div className="space-y-0">
                        {filteredFAQs.length > 0 ? (
                            filteredFAQs.map((faq, index) => (
                                <FAQItem
                                    key={index}
                                    faq={faq}
                                    isOpen={openIndex === index}
                                    onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                                />
                            ))
                        ) : (
                            <p className="text-center text-neutral-500 py-8">No FAQs found matching your search.</p>
                        )}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
