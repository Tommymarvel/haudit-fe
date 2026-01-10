import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AuthErrorCodes,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '@/lib/auth/firebase';
import { FirebaseError } from 'firebase/app';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import axiosInstance from '@/lib/axiosinstance';
import { createAuthCookie } from '@/actions/auth';

export function useSignupFlow(onSuccess?: (email: string) => void) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function signup(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    userType: string = 'artist'
  ) {
    setSubmitting(true);
    try {
      // 1) create user
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // 2) grab token
      const idToken = await cred.user.getIdToken();
      const refreshToken = cred.user.refreshToken;

      // 3) tell your backend
      await axiosInstance.post('/auth/signup', {
        idToken,
        refreshToken,
        first_name: firstName,
        last_name: lastName,
        email: email,
        user_type: userType,
      });

      // 4) Request OTP immediately after signup
      await axiosInstance.post('/auth/request-verify-email', {
        email,
      });

      // 5) stash email and trigger success callback (for modal)
      sessionStorage.setItem('verifyEmail', email);
      toast.info('Account created. Check email to verify.');
      
      // If onSuccess callback is provided, call it (to show modal)
      // Otherwise, navigate to verify-otp page (fallback)
      if (onSuccess) {
        onSuccess(email);
      } else {
        router.push('/signup/verify-otp');
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        const axiosError = error as AxiosError<{ message?: string }>;
        toast.error(
          (axiosError.response && axiosError.response.data
            ? axiosError.response.data.message || axiosError.response.data
            : axiosError.message || 'An error occurred'
          ).toString()
        );
      } else if (error instanceof FirebaseError) {
        let msg: string;
        switch (error.code) {
          case AuthErrorCodes.EMAIL_EXISTS:
            msg = 'An account with this email already exists.';
            break;
          case AuthErrorCodes.WEAK_PASSWORD:
            msg = 'Password is too weak. Please use a stronger password.';
            break;
          default:
            msg = error.message;
        }
        toast.error(msg);
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return { signup, submitting };
}

export function useGoogleLogin() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(false);

  async function loginWithGoogle() {
    let sessionEmail = '';
    try {
      sessionStorage.removeItem('verifyEmail');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      sessionEmail = result.user.email || '';
      sessionStorage.setItem('verifyEmail', sessionEmail);

      setIsLogin(true);

      const res = await axiosInstance.post('/auth/login', {
        idToken,
      });
      // Token cookie is set automatically by the server

      console.log(res);

      if (res.data.status === 302) {
        router.push('/signup/verify-otp');
        return;
      }

      await createAuthCookie();
      router.push('/dashboard');
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
      } else if (error instanceof AxiosError) {
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
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setIsLogin(false);
    }
  }

  return { loginWithGoogle, isLogin };
}

export function useLoginFlow(onVerifyEmail?: (email: string, password?: string) => void) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function login(email: string, password: string) {
    setSubmitting(true);
    try {
      // 1) Sign in with Firebase
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // 2) Get idToken
      const idToken = await cred.user.getIdToken();

      // 3) Send to backend
      const res = await axiosInstance.post('/auth/login', {
        idToken,
      });

      // Token cookie is set automatically by the server
      toast.success('Login successful!');
      
      // Navigate based on user status
      if (res.data.status === 304) {
        if (onVerifyEmail) {
          onVerifyEmail(email, password);
        } else {
          router.push('/signup/verify-otp');
        }
        return;
      }

      await createAuthCookie();
      router.push('/dashboard');
    } catch (error) {
      if (error instanceof FirebaseError) {
        let msg: string;
        switch (error.code) {
          case AuthErrorCodes.INVALID_EMAIL:
            msg = 'Invalid email address.';
            break;
          case AuthErrorCodes.USER_DELETED:
            msg = 'No account found with this email.';
            break;
          case AuthErrorCodes.INVALID_PASSWORD:
          case 'auth/wrong-password':
            msg = 'Incorrect password.';
            break;
          case AuthErrorCodes.TOO_MANY_ATTEMPTS_TRY_LATER:
            msg = 'Too many failed attempts. Please try again later.';
            break;
          default:
            msg = error.message;
        }
        toast.error(msg);
      } else if (error instanceof AxiosError) {
        const axiosError = error as AxiosError<{ message?: string; statusCode?: number }>;
        const responseData = axiosError.response?.data;
        const errorMessage = responseData?.message || axiosError.message || 'An error occurred';
        
        // Check for unverified email error
        if (
          (responseData?.statusCode === 400 || axiosError.response?.status === 400) &&
          errorMessage === "You are yet to be verified, kindly check your email for the one time password"
        ) {
          toast.info("Please verify your email to continue.");
          if (onVerifyEmail) {
            onVerifyEmail(email, password);
          }
        } else {
          toast.error(errorMessage.toString());
        }
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return { login, submitting };
}
