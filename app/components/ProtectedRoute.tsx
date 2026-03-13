'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Authenticated but profile is incomplete — no user_type yet
    if (user && !user.user_type && pathname !== '/complete-profile') {
      router.push('/complete-profile');
    }
  }, [isAuthenticated, isLoading, user, pathname, router]);

  // Show spinner while loading, unauthenticated, or during redirect
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7B00D4]"></div>
      </div>
    );
  }

  // Still show spinner while redirecting to complete-profile
  if (user && !user.user_type) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7B00D4]"></div>
      </div>
    );
  }

  return <>{children}</>;
}
