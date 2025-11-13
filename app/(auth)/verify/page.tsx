'use client';
import { useState } from 'react';
import { User, Pencil } from 'lucide-react';
import OTPInput from '../components/auth/OTPInput';

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams?: { email?: string };
}) {
  const [email, setEmail] = useState(
    searchParams?.email ?? 'johndoe@gmail.com'
  );
  const [otp, setOtp] = useState('');

  const canContinue = otp.length === 4;

  const resend = async () => {
    // TODO: await api.post('/auth/verification/resend', { email })
    console.log('resend to', email);
  };

  const verify = async () => {
    if (!canContinue) return;
    // TODO: await api.post('/auth/verification/confirm', { email, code: otp })
    console.log('verify', { email, otp });
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Centered dialog */}
      <div className="absolute inset-0 grid place-items-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-8">
          <h2 className="text-2xl  font-medium text-[#1F1F1F]">
            Verify your email
          </h2>
          <p className="mt-1 text-sm text-[#959595]">
            to continue into Haudit.
          </p>

          <div className="relative my-4">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 pl-10 pr-10 py-2.5 text-black outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
            />
            <button
              type="button"
              onClick={() => setEmail('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
              title="Edit email"
            >
              <Pencil className="w-5 h-5" />
            </button>
          </div>

          {/* OTP */}
          <div className="mt-5">
            <label className="mb-2 block text-sm text-[#2D2D2D]">
              Verification code
            </label>
            <p className="mb-3 text-sm text-[#959595]">
              Check your email for verification code
            </p>
            <div className="flex ">
              <OTPInput length={4} value={otp} onChange={setOtp} />
            </div>
          </div>

          <button
            onClick={verify}
            disabled={!canContinue}
            className="mt-6 w-full rounded-2xl text-white py-3 font-medium transition-colors disabled:bg-[#959595] enabled:bg-[#7B00D4] enabled:hover:bg-[#6A00B8]"
          >
            Continue
          </button>

          <p className="mt-3 text-sm text-neutral-500">
            Didn’t receive the code?{' '}
            <button onClick={resend} className="text-[#7B00D4] hover:underline">
              Resend code
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
