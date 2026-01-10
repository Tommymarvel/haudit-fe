'use client';
import Image from 'next/image';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

type RoleKey = 'solo' | 'labelArtist' | 'recordLabel';

// Map UI role keys to backend user_type values
const ROLE_TO_USER_TYPE: Record<RoleKey, string> = {
  solo: 'artist',
  labelArtist: 'label_artist',
  recordLabel: 'record_label',
};

const ROLES: {
  key: RoleKey;
  title: string;
  description: string;
}[] = [
  {
    key: 'solo',
    title: 'Solo Artist',
    description:
      'An artist who wants to manage their royalties, expenses, and advances independently who have access to their royalty reporting sheet.',
  },
  {
    key: 'labelArtist',
    title: 'Label Artist',
    description:
      'A signed artist who can view their expense, royalty, and advance analytics uploaded by their label.',
  },
  {
    key: 'recordLabel',
    title: 'Record label',
    description:
      'A label who will manage artists signed under them and input royalty files, record advance and expenses.',
  },
];

type Props = {
  defaultValue?: RoleKey;
  onChange?: (role: RoleKey) => void;
};

const Page = ({ defaultValue = 'solo', onChange }: Props) => {
  const [value, setValue] = useState<RoleKey>(defaultValue as RoleKey);
  const router = useRouter();

  const handleContinue = () => {
    const userType = ROLE_TO_USER_TYPE[value];
    // Pass user_type as a query parameter to signup page
    router.push(`/signup?user=${userType}`);
  };
  return (
    <div className=''>
      <div className=" rounded-l grid place-items-center ">
        <Image src="/haudit-logo.svg" alt="Haudit" width={48} height={48} />
      </div>
      <h1 className="mt-6 text-2xl text-center font-medium text-[#1F1F1F]">
        Welcome to Haudit{' '}
      </h1>
      <p className="mt-1 text-sm text-center text-neutral-500">
        Choose the type of Haudit account that best work for you.{' '}
      </p>
      <section className='w-full mt-6'>
        <fieldset className="w-full">
          <legend className="sr-only">Choose your role</legend>

          <div className="w-full space-y-8">
            {ROLES.map((r) => {
              const id = `role-${r.key}`;
              const checked = value === r.key;

              return (
                <label
                  key={r.key}
                  htmlFor={id}
                  className={[
                    'block cursor-pointer  rounded-2xl border bg-white p-5 transition',
                    'border-neutral-200 hover:border-neutral-300',
                    checked
                      ? 'border-[#7B00D4]/40 ring-2 ring-[#7B00D4]/30'
                      : 'ring-0',
                    // when the input (peer) is keyboard-focused
                    'peer-focus-visible:ring-2 peer-focus-visible:ring-neutral-300',
                  ].join(' ')}
                >
                  {/* The real control (kept visible to AT, visually hidden) */}
                  <input
                    id={id}
                    type="radio"
                    name="role"
                    value={r.key}
                    checked={checked}
                    onChange={() => {
                      setValue(r.key);
                      onChange?.(r.key);
                    }}
                    className="sr-only peer"
                  />

                  <div className="flex items-start justify-between">
                    <h3 className="text-[18px] font-medium text-[#A4A7AE]">
                      {r.title}
                    </h3>

                    {/* tiny dot indicator */}
                    <span
                      aria-hidden
                      className={[
                        'mt-1 h-2.5 w-2.5 rounded-full border',
                        checked
                          ? 'bg-[#7B00D4] border-[#7B00D4]'
                          : 'bg-transparent border-neutral-300',
                      ].join(' ')}
                    />
                  </div>

                  <p className="mt-2 text-[14px] leading-5 text-[#959595]">
                    {r.description}
                  </p>
                </label>
              );
            })}
          </div>
        </fieldset>
      </section>
      
      {/* Continue Button */}
      <button
        type="button"
        onClick={handleContinue}
        className="mt-8 w-full rounded-2xl bg-[#7B00D4] px-4 py-3 text-sm font-medium text-white hover:bg-[#6A00B8] transition-colors"
      >
        Continue
      </button>
    </div>
  );
};

export default Page;
