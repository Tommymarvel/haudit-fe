'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axiosInstance from '@/lib/axiosinstance';
import { clearAuthCookie } from '@/actions/auth';

interface NameEntry {
  _id: string;
  name: string;
  normalized_name: string;
  name_type: 'first_name' | 'last_name' | 'other_names';
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type?: string;
  avatar?: string;
  bvn?: string;
  business_document?: string;
  email_verified?: boolean;
  other_names?: string[];
  names?: NameEntry[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const PREVIEW_ROLE_STORAGE_KEY = 'haudit_preview_role';
const PREVIEW_ROLES = ['label_artist', 'record_label', 'solo_artist'] as const;
type PreviewRole = (typeof PREVIEW_ROLES)[number];

function getPreviewRoleFromSession(): PreviewRole | null {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const roleFromQuery = params.get('previewRole');

  if (roleFromQuery === 'off') {
    window.sessionStorage.removeItem(PREVIEW_ROLE_STORAGE_KEY);
    return null;
  }

  if (roleFromQuery && PREVIEW_ROLES.includes(roleFromQuery as PreviewRole)) {
    const role = roleFromQuery as PreviewRole;
    window.sessionStorage.setItem(PREVIEW_ROLE_STORAGE_KEY, role);
    return role;
  }

  const storedRole = window.sessionStorage.getItem(PREVIEW_ROLE_STORAGE_KEY);
  if (storedRole && PREVIEW_ROLES.includes(storedRole as PreviewRole)) {
    return storedRole as PreviewRole;
  }

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = async () => {
    try {
      const response = await axiosInstance.get('/auth/whoami');
      // The API returns { message, data: { ...user } }
      const raw = response.data.data;

      // Derive first_name / last_name from the names array
      const names: NameEntry[] = raw.names ?? [];
      const first_name =
        names.find((n) => n.name_type === 'first_name')?.name ??
        raw.first_name ??
        '';
      const last_name =
        names.find((n) => n.name_type === 'last_name')?.name ??
        raw.last_name ??
        '';
      const namesFromEntries = names
        .filter((n) => n.name_type === 'other_names')
        .map((n) => n.name);
      const other_names = namesFromEntries.length > 0 ? namesFromEntries : raw.other_names ?? [];

      const userData: User = {
        ...raw,
        id: raw._id ?? raw.id,
        first_name,
        last_name,
        other_names,
        names,
      };

      setUser(userData);
      return userData;
    } catch (error) {
      setUser(null);
      throw error;
    }
  };

  const refreshUser = async () => {
    setIsLoading(true);
    try {
      await fetchUser();
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    await clearAuthCookie();
    router.push('/login');
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        await fetchUser();
      } catch {
        const previewRole = getPreviewRoleFromSession();
        if (previewRole) {
          setUser({
            id: 'preview-user',
            email: 'preview@haudit.dev',
            first_name: 'Diamond',
            last_name: 'Artist',
            user_type: previewRole,
          });
          return;
        }

        setUser(null);
        await clearAuthCookie();
        
        const isAuthPage = pathname?.startsWith('/login') ||
                           pathname?.startsWith('/signup') ||
                           pathname?.startsWith('/forgot-password') ||
                           pathname?.startsWith('/reset-password') ||
                           pathname?.startsWith('/whoareyou') ||
                           pathname?.startsWith('/complete-profile');

        if (!isAuthPage) {
          router.push('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
