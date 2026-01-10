'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Eye, EyeOff, Check } from 'lucide-react';
import clsx from 'clsx';
import { useSignupFlow, useGoogleLogin } from '../hooks/useAuth';
import { useSearchParams } from 'next/navigation';
import VerifyOTPModal from '../components/auth/VerifyOTPModal';
import { useAuth } from '@/contexts/AuthContext';

const PasswordSchema = Yup.object({
  firstName: Yup.string().required('Required'),
  lastName: Yup.string().required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string()
    .min(8, 'At least 8 characters')
    .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Add a special character')
    .matches(/\d/, 'Add a number')
    .required('Required'),
});

function SignupContent() {
  const [show, setShow] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const userType = searchParams.get('user') || 'artist'; // Default to 'artist' if not provided
  
  const handleSignupSuccess = (email: string) => {
    setRegisteredEmail(email);
    setShowOTPModal(true);
  };
  
  const { signup, submitting } = useSignupFlow(handleSignupSuccess);
  const { loginWithGoogle } = useGoogleLogin();

  const handleVerifyOTP = async () => {
    // Refresh user data and navigate to dashboard after successful verification
    await refreshUser();
    setShowOTPModal(false);
    router.push('/dashboard');
  };

  const handleResendOTP = () => {
    // The resend is now handled inside the modal
    console.log('OTP resent to:', registeredEmail);
  };

  return (
    <>
      <div className=" rounded-l grid place-items-center">
        <Image src="/haudit-logo.svg" alt="Haudit" width={48} height={48} />
      </div>
      <h1 className="mt-6 text-2xl text-center font-medium text-[#1F1F1F]">
        Create Haudit account{' '}
      </h1>
      <p className="mt-1 text-sm text-center text-neutral-500">
        Analyse and visualise your royalty report with few clicks.{' '}
      </p>

      <Formik
        initialValues={{
          firstName: '',
          lastName: '',
          email: '',
          password: '',
        }}
        validationSchema={PasswordSchema}
        onSubmit={(values) => {
          signup(
            values.email,
            values.password,
            values.firstName,
            values.lastName,
            userType
          );
        }}
      >
        {({ values }) => {
          const pass = values.password ?? '';
          const rules = {
            len: pass.length >= 8,
            special: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
            number: /\d/.test(pass),
          };

          // Check if all fields are filled and password rules are met
          const allRulesPassed = rules.len && rules.special && rules.number;
          const allFieldsFilled =
            values.firstName.trim() !== '' &&
            values.lastName.trim() !== '' &&
            values.email.trim() !== '' &&
            values.password.trim() !== '';
          const isFormValid = allFieldsFilled && allRulesPassed;

          return (
            <Form className="space-y-5 mt-6 max-w-[550px] w-full mx-auto">
              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm text-neutral-700">
                    Firstname
                  </label>
                  <div className="relative">
                    <Field
                      name="firstName"
                      placeholder="Enter your firstname"
                      className="w-full rounded-2xl border border-neutral-200 px-3 py-2.5 text-black outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                    />
                  </div>
                  <ErrorMessage
                    name="firstName"
                    component="p"
                    className="mt-1 text-xs text-rose-600"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-neutral-700">
                    Lastname
                  </label>
                  <div className="relative">
                    <Field
                      name="lastName"
                      placeholder="Enter your lastname"
                      className="w-full rounded-2xl border border-neutral-200 px-3 py-2.5 text-black  outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                    />
                  </div>
                  <ErrorMessage
                    name="lastName"
                    component="p"
                    className="mt-1 text-xs text-rose-600"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm text-neutral-700">
                  Email
                </label>
                <div className="relative">
                  <Field
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    className="w-full rounded-2xl border border-neutral-200 px-3 py-2.5 text-black  outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                  />
                </div>
                <ErrorMessage
                  name="email"
                  component="p"
                  className="mt-1 text-xs text-rose-600"
                />
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm text-neutral-700">
                  Password
                </label>
                <div className="relative">
                  <Field
                    name="password"
                    type={show ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-neutral-200  pr-10 px-3 py-2.5 text-black outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    aria-label={show ? 'Hide password' : 'Show password'}
                  >
                    {show ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Inline rules - only show when user starts typing */}
                {pass.length > 0 && (
                  <ul className="mt-3 space-y-1.5 text-sm">
                    <Rule
                      ok={rules.len}
                      label="Password must be at least 8 characters"
                    />
                    <Rule
                      ok={rules.special}
                      label="Password must contain special characters (#&%$)"
                    />
                    <Rule
                      ok={rules.number}
                      label="Password must contain numbers"
                    />
                  </ul>
                )}
                <ErrorMessage
                  name="password"
                  component="p"
                  className="mt-1 text-xs text-rose-600"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!isFormValid || submitting}
                className="w-full rounded-2xl text-white py-3 font-medium transition-colors disabled:bg-[#959595] enabled:bg-[#7B00D4] enabled:hover:bg-[#6A00B8]"
              >
                {submitting ? 'Creating account...' : 'Create account'}
              </button>

              {/* Google OAuth placeholder */}
              <button
                type="button"
                className="w-full rounded-2xl border border-neutral-300 px-3 text-black  bg-white py-2.5 font-medium"
                onClick={loginWithGoogle}
              >
                <span className="inline-flex items-center gap-2.5">
                  <GoogleIcon />
                  Sign up with Google
                </span>
              </button>

              <p className="text-center text-sm text-neutral-500">
                Already have an account?{' '}
                <Link href="/login" className="text-[#7B00D4] hover:underline">
                  Sign in
                </Link>
              </p>

              <p className="text-center  text-sm text-[#5A5A5A]">
                By clicking “create account”, I agree to your{' '}
                <Link href="/terms" className="underline text-[#7B00D4]">
                  Terms of service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="underline text-[#7B00D4]">
                  Privacy Policy
                </Link>
              </p>
            </Form>
          );
        }}
      </Formik>

      {/* OTP Verification Modal */}
      <VerifyOTPModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        email={registeredEmail}
        onVerify={handleVerifyOTP}
        onResend={handleResendOTP}
      />
    </>
  );
}

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li
      className={clsx(
        'flex items-center gap-2',
        ok ? 'text-green-600' : 'text-neutral-400'
      )}
    >
      <Check
        className={clsx('h-4 w-4', ok ? 'text-green-600' : 'text-neutral-300')}
      />
      {label}
    </li>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.61 20.083h-1.86v-.095H24v8h11.284A12.004 12.004 0 1 1 24 12a11.93 11.93 0 0 1 8.485 3.515l5.657-5.657C34.559 4.271 29.513 2 24 2 11.85 2 2 11.85 2 24s9.85 22 22 22c11.33 0 21-8.25 21-22 0-1.32-.14-2.61-.39-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.307 14.691l6.571 4.817A11.997 11.997 0 0 1 24 12c3.19 0 6.103 1.21 8.294 3.19l6.294-6.294C34.559 4.271 29.513 2 24 2 16.318 2 9.637 6.338 6.307 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 46c5.364 0 10.26-1.996 13.994-5.293l-6.466-5.472A11.94 11.94 0 0 1 24 36a11.997 11.997 0 0 1-11.17-7.676l-6.49 5.01C9.593 41.333 16.214 46 24 46z"
      />
      <path
        fill="#1976D2"
        d="M43.61 20.083H24v8h11.284a12.03 12.03 0 0 1-4.264 5.152l.006-.004 6.466 5.472C41.17 35.92 46 30.664 46 24c0-1.32-.14-2.61-.39-3.917z"
      />
    </svg>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupContent />
    </Suspense>
  );
}
