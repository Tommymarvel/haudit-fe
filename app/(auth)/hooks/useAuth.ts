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

export function useSignupFlow() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function signup(
    email: string,
    password: string,
    firstName: string,
    lastName: string
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
      });

      // 4) stash email and navigate
      sessionStorage.setItem('verifyEmail', email);
      toast.info('Account created. Check email to verify.');
      router.push('/signup/verify-otp');
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
      const token = res.data.token;

      if (token) {
        localStorage.setItem('authToken', token);
      }

      console.log(res);

      if (res.data.status === 302) {
        router.push('/signup/verify-otp');
        return;
      }

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
