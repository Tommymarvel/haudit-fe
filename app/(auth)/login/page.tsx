'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import PasswordField from '../components/auth/PasswordField';
import axiosInstance from '@/lib/axiosinstance';
import {
  AuthErrorCodes,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '@/lib/auth/firebase';
import { FirebaseError } from 'firebase/app';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const Schema = Yup.object({
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().required('Required'),
  remember: Yup.boolean(),
});

export default function SignInPage() {
 const router = useRouter();
 const [isLogin, setIsLogin] = useState(false);

 const handleGoogleLogin = async () => {
   let sessionEmail = '';
   try {
     sessionStorage.removeItem('verifyEmail');
     const provider = new GoogleAuthProvider();
     const result = await signInWithPopup(auth, provider);
     const idToken = await result.user.getIdToken();
     const refreshToken = result.user.refreshToken;
     sessionEmail = result.user.email || '';
     sessionStorage.setItem('verifyEmail', sessionEmail);

     setIsLogin(true);

     const res = await axiosInstance.post('/auth/login', {
       idToken,
       refreshToken,
     });
     const token = res.data.token;

     if (token) {
       localStorage.setItem('authToken', token);
     }

     console.log(res);

     if (res.data.status === 304) {
       router.push('/signup/verify-otp');
       return;
     }

     const backendUser = res.data.user;
     if (backendUser.bvn == null) {
       router.push('/signup/onboarding');
     } else if (backendUser.business_document !== 'submitted') {
       router.push('/signup/business-info');
     } else {
       router.push('/dashboard');
     }
   } catch (error) {
     if (sessionEmail) {
       sessionStorage.setItem('verifyEmail', sessionEmail);
     }

     if (error instanceof FirebaseError) {
       let msg: string;
       switch (error.code) {
         case AuthErrorCodes.POPUP_CLOSED_BY_USER:
           msg = 'Authentication popup was closed before completing sign-in.';
           break;
         case AuthErrorCodes.NETWORK_REQUEST_FAILED:
           msg = 'Network error — please check your connection and try again.';
           break;
         case AuthErrorCodes.INVALID_OAUTH_CLIENT_ID:
           msg = 'Configuration error — please contact support.';
           break;
         default:
           msg = error.message;
       }
       toast.error(msg);

       const axiosError = error as AxiosError<{ message?: string }>;
       if (
         axiosError.response?.data.message ===
         'Looks like we sent you one recently, kindly check for that and input in the fields'
       ) {
         toast.error(
           'Looks like we sent you one recently, kindly check for that and input in the fields'
         );

         router.push('/signup/verify-otp');
       } else {
         toast.error(
           (axiosError.response && axiosError.response.data
             ? axiosError.response.data.message || axiosError.response.data
             : axiosError.message || 'An error occurred'
           ).toString()
         );
       }
     }
   } finally {
     setIsLogin(false);
   }
 };
 


  return (
    <>
      <div className="rounded-l grid place-items-center">
        <Image src="/haudit-logo.svg" alt="Haudit" width={48} height={48} />
      </div>
      <h1 className="mt-6 text-2xl text-center font-medium text-[#1F1F1F]">
        Welcome back
      </h1>
      <p className="mt-1 text-sm text-center text-neutral-500">
        Sign in to your Haudit account
      </p>

      <Formik
        initialValues={{ email: '', password: '', remember: false }}
        validationSchema={Schema}
        onSubmit={async (vals) => {
          // TODO: await api.post('/auth/signin', vals)
          console.log('signin', vals);
        }}
      >
        {({ values, isSubmitting }) => {
          // Check if all required fields are filled
          const isFormValid =
            values.email.trim() !== '' && values.password.trim() !== '';

          return (
            <Form className="space-y-5 mt-6 max-w-[550px] w-full mx-auto">
              <div>
                <label className="mb-2 block text-sm text-neutral-700">
                  Email
                </label>
                <Field
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full rounded-2xl border border-neutral-200 px-3 py-2.5 text-black outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                />
                <ErrorMessage
                  name="email"
                  component="p"
                  className="mt-1 text-xs text-rose-600"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm text-neutral-700">Password</label>
                </div>
                <PasswordField
                  name="password"
                  placeholder="Enter your password"
                />
                <ErrorMessage
                  name="password"
                  component="p"
                  className="mt-1 text-xs text-rose-600"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-neutral-700">
                  <Field
                    type="checkbox"
                    name="remember"
                    className="h-4 w-4 rounded border-neutral-300"
                  />
                  Remember me
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-[#7B00D4] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full rounded-2xl text-white py-3 font-medium transition-colors disabled:bg-[#959595] enabled:bg-[#7B00D4] enabled:hover:bg-[#6A00B8]"
              >
                Sign in
              </button>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full rounded-2xl border border-neutral-300 px-3 text-black bg-white py-2.5 font-medium"
              >
                <span className="inline-flex items-center gap-2.5">
                  <GoogleIcon />
                  Sign in with Google
                </span>
              </button>

              <p className="text-center text-sm text-neutral-500">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-[#7B00D4] hover:underline">
                  Create account
                </Link>
              </p>

              <p className="text-center text-sm text-[#5A5A5A]">
                By signing in, I agree to your{' '}
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
