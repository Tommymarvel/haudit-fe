'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import axiosInstance from '@/lib/axiosinstance';

const Schema = Yup.object({
  email: Yup.string().email('Invalid').required('Required'),
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleForgotPassword = async (email: string) => {
    setSubmitting(true);
    try {
      await axiosInstance.post('/auth/forgot-password', { email });
      toast.success('Password reset link sent! Check your email.');
      // Navigate to reset-password page with email
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message || error.message;
        toast.error(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
      } else {
        toast.error('Failed to send reset link. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className=" grid place-items-center ">
        <Image src="/lock-icon.svg" alt="Lock" width={48} height={48} />
      </div>
      <h1 className="mt-6 text-2xl text-center font-medium text-[#1F1F1F]">
        Forgot Password?
      </h1>
      <p className="mt-1 text-sm text-center text-neutral-500">
        Don’t panic, enter your email to reset your password.
      </p>

      <Formik
        initialValues={{ email: '' }}
        validationSchema={Schema}
        onSubmit={async ({ email }) => {
          await handleForgotPassword(email);
        }}
      >
        {({ values, isSubmitting }) => {
          // Check if email field is filled
          const isFormValid = values.email.trim() !== '';

          return (
            <Form className="mt-6 space-y-5 max-w-[550px] w-full mx-auto">
              <div>
                <label className="mb-1 block text-sm text-neutral-700">
                  Email
                </label>
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
                disabled={!isFormValid || isSubmitting || submitting}
                className="w-full rounded-xl text-white py-2.5 text-sm font-medium transition-colors disabled:bg-[#959595] enabled:bg-[#7B00D4] enabled:hover:bg-[#6A00B8]"
              >
                {submitting ? 'Sending...' : 'Continue'}
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
          );
        }}
      </Formik>
    </>
  );
}
