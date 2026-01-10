'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/whoareyou',
  '/verify',
];

const PROTECTED_ROUTES = [
  '/dashboard',
  '/royalty',
  '/expenses',
  '/advance',
];

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = getCookie('authToken');
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route));
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname?.startsWith(route));

    // Redirect to login if accessing protected route without token
    if (isProtectedRoute && !token) {
      router.push('/login');
    }

    // Redirect to dashboard if accessing auth pages with token
    if (isPublicRoute && token && pathname !== '/verify') {
      router.push('/dashboard');
    }
  }, [pathname, router]);

  return {
    isAuthenticated: !!getCookie('authToken'),
    logout: () => {
      document.cookie = 'authToken=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
      router.push('/login');
    },
  };
}
