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
import { useAuth } from '@/contexts/AuthContext';

export function useSignupFlow(onSuccess?: (email: string) => void) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function signup(
    email: string,
    password: string
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
        email: email,
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
        const axiosError = error as AxiosError<{ message?: string | string[]; statusCode?: number }>;
        const responseData = axiosError.response?.data;
        const errorMessage = Array.isArray(responseData?.message) 
          ? responseData.message[0] 
          : (responseData?.message || axiosError.message || 'An error occurred');
        
        // Check for unverified email error
        if (
          (responseData?.statusCode === 400 || axiosError.response?.status === 400) &&
          errorMessage === "You are yet to be verified, kindly check your email for the one time password"
        ) {
          toast.info("Please verify your email to continue.");
          if (onSuccess) {
            onSuccess(email);
          } else {
            router.push('/signup/verify-otp');
          }
        } else {
          toast.error(errorMessage.toString());
        }
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

export function useGoogleSignup(onSuccess?: (email: string) => void) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function signupWithGoogle() {
    let sessionEmail = '';
    setSubmitting(true);
    
    try {
      sessionStorage.removeItem('verifyEmail');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      const refreshToken = result.user.refreshToken;
      sessionEmail = result.user.email || '';
      sessionStorage.setItem('verifyEmail', sessionEmail);

      // Call signup endpoint to create new account
      await axiosInstance.post('/auth/signup', {
        idToken,
        refreshToken,
        email: sessionEmail,
      });

      // Request OTP immediately after signup
      await axiosInstance.post('/auth/request-verify-email', {
        email: sessionEmail,
      });

      toast.info('Account created. Check email to verify.');
      
      // Show verification modal via callback
      if (onSuccess) {
        onSuccess(sessionEmail);
      } else {
        router.push('/signup/verify-otp');
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
      } else if (error instanceof AxiosError) {
        const axiosError = error as AxiosError<{ message?: string | string[]; statusCode?: number }>;
        const responseData = axiosError.response?.data;
        const errorMessage = Array.isArray(responseData?.message) 
          ? responseData.message[0] 
          : (responseData?.message || axiosError.message || 'An error occurred');
        
        
        // Check for unverified email error
        if (
          (responseData?.statusCode === 400 || axiosError.response?.status === 400) &&
          errorMessage === "You are yet to be verified, kindly check your email for the one time password"
        ) {
          toast.info("Please verify your email to continue.");
          if (onSuccess) {
            onSuccess(sessionEmail);
          } else {
            router.push('/signup/verify-otp');
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

  return { signupWithGoogle, submitting };
}

export function useGoogleLogin(onVerifyEmail?: (email: string) => void) {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(false);
  const { refreshUser } = useAuth();

  async function loginWithGoogle() {
    let sessionEmail = '';
    let firebaseUser = null;
    try {
      sessionStorage.removeItem('verifyEmail');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      firebaseUser = result.user; // Store the Firebase user
      const idToken = await result.user.getIdToken();
      sessionEmail = result.user.email || '';
      sessionStorage.setItem('verifyEmail', sessionEmail);

      setIsLogin(true);

      // Call login endpoint - should only work for existing accounts
      const res = await axiosInstance.post('/auth/login', {
        idToken,
      });

      console.log(res);

      // Check if verification is needed
      if (res.data.status === 302 || res.data.status === 304) {
        toast.info("Please verify your email to continue.");
        if (onVerifyEmail) {
          onVerifyEmail(sessionEmail);
        } else {
          router.push('/signup/verify-otp');
        }
        return;
      }

      toast.success('Login successful!');
      await createAuthCookie();
      await refreshUser();
      
      // Check if user has completed profile using data from login response
      const user = res.data.user;
      
      if (!user.user_type) {
        // User hasn't completed profile - redirect to whoareyou
        router.push('/whoareyou');
      } else {
        // User has completed profile - redirect to dashboard
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
      } else if (error instanceof AxiosError) {
        const axiosError = error as AxiosError<{ message?: string; statusCode?: number }>;
        const responseData = axiosError.response?.data;
        const errorMessage = responseData?.message || axiosError.message || 'An error occurred';
        
        console.log('Login error:', { statusCode: responseData?.statusCode, message: errorMessage });
        
        // Check for unverified email error
        if (
          (responseData?.statusCode === 400 || axiosError.response?.status === 400) &&
          errorMessage === "You are yet to be verified, kindly check your email for the one time password"
        ) {
          toast.info("Please verify your email to continue.");
          if (onVerifyEmail) {
            onVerifyEmail(sessionEmail);
          } else {
            router.push('/signup/verify-otp');
          }
        } else if (errorMessage === 'Looks like you do not have an account with us') {
          // Account doesn't exist in backend - delete the Firebase account that was just created
          console.log('Attempting to delete Firebase user...');
          if (firebaseUser) {
            try {
              // Delete the Firebase user account
              await firebaseUser.delete();
              console.log('Firebase user deleted successfully');
              // Clear any remaining auth state
              await auth.signOut();
            } catch (deleteError) {
              console.error('Failed to delete Firebase user:', deleteError);
              // Force sign out even if delete failed
              try {
                await auth.signOut();
              } catch (signOutError) {
                console.error('Failed to sign out:', signOutError);
              }
            }
          }
          toast.error('No account found. Please sign up first.');
        } else {
          toast.error(errorMessage.toString());
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
  const { refreshUser } = useAuth();

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

      // Refresh user data to get latest profile
      await createAuthCookie();
      await refreshUser();
      
      // Check if user has completed profile using data from login response
      const user = res.data.user;
      
      if (!user.user_type) {
        // User hasn't completed profile - redirect to whoareyou
        router.push('/whoareyou');
      } else {
        // User has completed profile - redirect to dashboard
        router.push('/dashboard');
      }
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
