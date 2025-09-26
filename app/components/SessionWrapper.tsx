'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SessionWrapper({ 
  children,
  requireAuth = true
}: { 
  children: React.ReactNode;
  requireAuth?: boolean;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session && requireAuth) {
      router.push('/auth/login');
    }
  }, [session, status, requireAuth, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}