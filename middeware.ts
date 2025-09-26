import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Handle file access
    if (req.nextUrl.pathname.startsWith('/uploads/')) {
      return NextResponse.next();
    }

    const token = req.nextauth.token;
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth');

    // If logged in and trying to access auth page
    if (token && isAuthPage) {
      return NextResponse.redirect(
        new URL(
          token.userType === 'student' ? '/student/dashboard' : '/dashboard',
          req.url
        )
      );
    }

    // If student trying to access teacher routes or vice versa
    if (token?.userType === 'student' && req.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/student/dashboard', req.url));
    }

    if (token?.userType === 'teacher' && req.nextUrl.pathname.startsWith('/student/dashboard')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/student/dashboard/:path*',
    '/auth/:path*',
    '/profile/:path*',
    '/uploads/:path*'
  ]
};