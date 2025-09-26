'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function SessionCheck() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log('Session Status:', status);
    console.log('Current Session:', session);
    console.log('Current Path:', pathname);

    // Wait until session is checked
    if (status === 'loading') return;

    // If no session and not on login page, redirect to login
    if (!session && !pathname?.startsWith('/auth/')) {
      console.log('No session, redirecting to login');
      router.push('/auth/login');
      return;
    }

    // If on login page with session, redirect to appropriate dashboard
    if (session && pathname?.startsWith('/auth/')) {
      const redirectPath = session.user.userType === 'student' ? '/student/dashboard' : '/dashboard';
      console.log('Has session on auth page, redirecting to:', redirectPath);
      router.push(redirectPath);
      return;
    }
  }, [session, status, pathname, router]);

  return null;
}