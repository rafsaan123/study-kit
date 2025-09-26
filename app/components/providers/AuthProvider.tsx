'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

function Auth({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return;

    // If there's no session and not on an auth page
    if (!session && !pathname?.includes('/auth/')) {
      router.push('/auth/login');
    }

    // Redirect teachers from student pages and vice versa
    if (session?.user) {
      if (session.user.userType === 'student' && pathname?.startsWith('/teacher-dashboard')) {
        router.push('/dashboard');
      }
      if (session.user.userType === 'teacher' && pathname?.startsWith('/dashboard')) {
        router.push('/teacher-dashboard');
      }
    }
  }, [session, status, pathname, router]);

  return children;
}

export default function AuthProvider({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <Auth>{children}</Auth>
    </SessionProvider>
  );
}