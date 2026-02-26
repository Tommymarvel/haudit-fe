'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, Pencil } from 'lucide-react';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import OTPInput from '../../components/auth/OTPInput';
import axiosInstance from '@/lib/axiosinstance';
import { useAuth } from '@/contexts/AuthContext';

const RESEND_COOLDOWN = 5 * 60; // 5 minutes in seconds
const OTP_EXPIRY = 10 * 60; // 10 minutes in seconds

export default function VerifyEmailPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const [otpExpiryTime, setOtpExpiryTime] = useState(OTP_EXPIRY);

  useEffect(() => {
    // Get email from sessionStorage (set during signup/login)
    const storedEmail = sessionStorage.getItem('verifyEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  // OTP expiry timer
  useEffect(() => {
    if (otpExpiryTime <= 0) return;

    const timer = setInterval(() => {
      setOtpExpiryTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.warning('OTP has expired. Please request a new one.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [otpExpiryTime]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const canContinue = otp.length === 4 && !isVerifying;

  const resend = async () => {
    if (isResending || resendCooldown > 0) return;
    
    setIsResending(true);
    try {
      await axiosInstance.post('/auth/request-verify-email', { 
        email 
      });
      toast.success('Verification code sent! Check your email.');
      // Reset timers
      setResendCooldown(RESEND_COOLDOWN);
      setOtpExpiryTime(OTP_EXPIRY);
      setOtp(''); // Clear previous OTP
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message || error.message;
        toast.error(errorMessage);
      } else {
        toast.error('Failed to resend verification code');
      }
    } finally {
      setIsResending(false);
    }
  };

  const verify = async () => {
    if (!canContinue) return;
    
    setIsVerifying(true);
    try {
      await axiosInstance.post('/auth/verify-email-otp', { 
        email, 
        otp 
      });
      toast.success('Email verified successfully!');
      
      // Refresh user data
      await refreshUser();
      
      // Check if user has completed profile
      const response = await axiosInstance.get('/auth/whoami');
      const user = response.data.data;
      
      if (!user.user_type) {
        // User hasn't completed profile - redirect to whoareyou
        router.push('/whoareyou');
      } else {
        // User has completed profile - redirect to dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message || error.message;
        toast.error(errorMessage);
      } else {
        toast.error('Invalid verification code');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[1px]"
        aria-hidden="true"
      />

      {/* Centered dialog */}
      <div className="relative min-h-screen grid place-items-center px-4 py-8">
        <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-8 my-8">
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
            {otpExpiryTime > 0 ? (
              <p className="mt-2 text-xs text-neutral-600 font-medium">
                Code expires in {formatTime(otpExpiryTime)}
              </p>
            ) : (
              <p className="mt-2 text-xs text-rose-600 font-medium">
                This code has expired. Please request a new one.
              </p>
            )}
          </div>

          <button
            onClick={verify}
            disabled={!canContinue || otpExpiryTime === 0}
            className="mt-6 w-full rounded-2xl text-white py-3 font-medium transition-colors disabled:bg-[#959595] enabled:bg-[#7B00D4] enabled:hover:bg-[#6A00B8]"
          >
            {isVerifying ? 'Verifying...' : 'Continue'}
          </button>

          <div className="mt-3 text-sm text-neutral-500">
            {resendCooldown > 0 ? (
              <p>
                Didn't receive the code?{' '}
                <span className="text-neutral-600 font-medium">
                  Resend available in {formatTime(resendCooldown)}
                </span>
              </p>
            ) : (
              <p>
                Didn't receive the code?{' '}
                <button
                  onClick={resend}
                  disabled={isResending}
                  className="text-[#7B00D4] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? 'Sending...' : 'Resend code'}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
