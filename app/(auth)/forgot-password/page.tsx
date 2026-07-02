'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Image from 'next/image';
import { toast } from 'react-toastify';
import axiosInstance from '@/lib/axiosinstance';

const Schema = Yup.object({
  email: Yup.string().email('Invalid email').required('Required'),
});

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const handleForgotPassword = async (email: string) => {
    await axiosInstance.post('/auth/forgot-password', { email });
    setSentEmail(email);
    setSent(true);
  };

  if (sent) {
    return (
      <>
        <div className="grid place-items-center">
          <Image src="/lock-icon.svg" alt="Lock" width={48} height={48} />
        </div>
        <h1 className="mt-6 text-2xl text-center font-medium text-[#1F1F1F]">
          Check your email
        </h1>
        <p className="mt-1 text-sm text-center text-neutral-500">
          We sent a password reset link to <span className="font-medium text-[#1F1F1F]">{sentEmail}</span>.
          Follow the instructions in the email to reset your password.
        </p>
        <div className="mt-6 max-w-[550px] w-full mx-auto space-y-3">
          <button
            type="button"
            onClick={async () => {
              try {
                await axiosInstance.post('/auth/forgot-password', { email: sentEmail });
                toast.success('Reset link resent!');
              } catch {
                toast.error('Failed to resend. Please try again.');
              }
            }}
            className="w-full rounded-xl border border-violet-500 py-2.5 text-sm text-violet-700"
          >
            Resend email
          </button>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center rounded-xl bg-[#7B00D4] py-2.5 text-sm font-medium text-white"
          >
            Back to Sign In
          </Link>
          <p className="mt-12 text-[11px] text-neutral-400">
            © {new Date().getFullYear()} Haudit. All rights reserved
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="grid place-items-center">
        <Image src="/lock-icon.svg" alt="Lock" width={48} height={48} />
      </div>
      <h1 className="mt-6 text-2xl text-center font-medium text-[#1F1F1F]">
        Forgot Password?
      </h1>
      <p className="mt-1 text-sm text-center text-neutral-500">
        Don&apos;t panic, enter your email to reset your password.
      </p>

      <Formik
        initialValues={{ email: '' }}
        validationSchema={Schema}
        onSubmit={async ({ email }, { setSubmitting }) => {
          try {
            await handleForgotPassword(email);
          } catch (error: unknown) {
            const msg = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
            if (msg) {
              toast.error(msg);
            } else {
              toast.error('Failed to send reset link. Please try again.');
            }
            setSubmitting(false);
          }
        }}
      >
        {({ values, isSubmitting }) => (
          <Form className="mt-6 space-y-5 max-w-[550px] w-full mx-auto">
            <div>
              <label className="mb-1 block text-sm text-neutral-700">Email</label>
              <Field
                name="email"
                type="email"
                placeholder="Enter your email address"
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-black outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
              />
              <ErrorMessage
                name="email"
                component="p"
                className="mt-1 text-xs text-rose-600"
              />
            </div>

            <button
              type="submit"
              disabled={!values.email.trim() || isSubmitting}
              className="w-full rounded-xl text-white py-2.5 text-sm font-medium transition-colors disabled:bg-[#959595] enabled:bg-[#7B00D4] enabled:hover:bg-[#6A00B8]"
            >
              {isSubmitting ? 'Sending…' : 'Continue'}
            </button>
            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center rounded-xl border border-violet-500 py-2.5 text-sm text-violet-700"
            >
              Back to Sign In
            </Link>

            <p className="mt-12 text-[11px] text-neutral-400">
              © {new Date().getFullYear()} Haudit. All rights reserved
            </p>
          </Form>
        )}
      </Formik>
    </>
  );
}
