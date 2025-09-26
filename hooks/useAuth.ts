'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth(requireAuth = true) {
  const { data: session, status } = useSession();
  const loading = status === 'loading';
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // If no session and auth is required
    if (!session && requireAuth) {
      router.push(`/auth/login?from=${encodeURIComponent(pathname || '/')}`);
      return;
    }

    // If session exists and trying to access auth pages
    if (session && pathname?.startsWith('/auth')) {
      const redirectPath = session.user.userType === 'student' ? '/dashboard' : '/teacher-dashboard';
      router.push(redirectPath);
      return;
    }

    // Redirect based on user type
    if (session?.user) {
      const isStudent = session.user.userType === 'student';
      const isTeacherPath = pathname?.startsWith('/teacher-dashboard');
      const isStudentPath = pathname?.startsWith('/dashboard');

      if (isStudent && isTeacherPath) {
        router.push('/dashboard');
      } else if (!isStudent && isStudentPath) {
        router.push('/teacher-dashboard');
      }
    }
  }, [session, loading, requireAuth, pathname, router]);

  return { session, loading };
}