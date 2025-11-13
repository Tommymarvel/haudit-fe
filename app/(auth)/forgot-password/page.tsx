'use client';
import Link from 'next/link';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Image from 'next/image';

const Schema = Yup.object({
  email: Yup.string().email('Invalid').required('Required'),
});

export default function ForgotPasswordPage() {
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
          // TODO: await api.post('/auth/password/forgot', { email })
          // Navigate to /reset-password?email=...
          console.log('forgot', email);
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
                disabled={!isFormValid || isSubmitting}
                className="w-full rounded-xl text-white py-2.5 text-sm font-medium transition-colors disabled:bg-[#959595] enabled:bg-[#7B00D4] enabled:hover:bg-[#6A00B8]"
              >
                Continue
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
