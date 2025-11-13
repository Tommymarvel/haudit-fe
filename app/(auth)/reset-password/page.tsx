'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Eye, EyeOff, Check } from 'lucide-react';
import clsx from 'clsx';
import Image from 'next/image';

const schema = Yup.object({
  password: Yup.string()
    .min(8, 'At least 8 characters')
    .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Add a special character')
    .matches(/\d/, 'Add a number')
    .required('Required'),
  confirm: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Required'),
});

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <div className=" grid place-items-center ">
        <Image src="/lock-icon.svg" alt="Lock" width={48} height={48} />
      </div>
      <h1 className="mt-6 text-2xl text-center font-medium text-[#1F1F1F]">
        Reset Password
      </h1>
      <p className="mt-1 text-sm text-center text-neutral-500">
        Enter your new password to keep your account safe & secure.
      </p>

      <Formik
        initialValues={{ password: '', confirm: '' }}
        validationSchema={schema}
        onSubmit={async ({ password }) => {
          // TODO: await api.post('/auth/password/reset', { password, token: ... })
          console.log('reset', password);
        }}
      >
        {({ values, isSubmitting }) => {
          const pass = values.password ?? '';
          const rules = {
            len: pass.length >= 8,
            special: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
            number: /\d/.test(pass),
          };

          // Check if all fields are filled and password rules are met
          const allRulesPassed = rules.len && rules.special && rules.number;
          const passwordsMatch =
            values.password === values.confirm && values.confirm !== '';
          const isFormValid =
            allRulesPassed && passwordsMatch && values.password.trim() !== '';

          return (
            <Form className="space-y-5 mt-6 max-w-[550px] w-full mx-auto">
              <div>
                <label className="mb-2 block text-sm text-neutral-700">
                  New Password
                </label>
                <div className="relative">
                  <Field
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your new password"
                    className="w-full rounded-2xl border border-neutral-200 pr-10 px-3 py-2.5 text-black outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword ? (
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

              <div>
                <label className="mb-2 block text-sm text-neutral-700">
                  Confirm password
                </label>
                <div className="relative">
                  <Field
                    name="confirm"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter your new password"
                    className="w-full rounded-2xl border border-neutral-200 pr-10 px-3 py-2.5 text-black outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <ErrorMessage
                  name="confirm"
                  component="p"
                  className="mt-1 text-xs text-rose-600"
                />
              </div>

              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full rounded-2xl text-white py-3 font-medium transition-colors disabled:bg-[#959595] enabled:bg-[#7B00D4] enabled:hover:bg-[#6A00B8]"
              >
                Continue
              </button>
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center rounded-2xl border border-[#7B00D4] py-3 font-medium text-[#7B00D4] hover:bg-[#7B00D4]/5 transition-colors"
              >
                Back to Sign In
              </Link>

              <p className="text-center text-sm text-[#5A5A5A]">
                By continuing, I agree to your{' '}
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
