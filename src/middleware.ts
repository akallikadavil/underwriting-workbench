import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role as string;

    // Role-based route protection
    const roleRestrictions: Record<string, string[]> = {
      '/admin/users': ['IT_ADMIN'],
      '/admin/rules': ['IT_ADMIN'],
      '/admin/config': ['IT_ADMIN', 'MANAGEMENT'],
      '/admin/audit': ['IT_ADMIN', 'COMPLIANCE', 'MANAGEMENT'],
      '/senior-review': ['SENIOR_UNDERWRITER', 'IT_ADMIN', 'MANAGEMENT'],
      '/compliance': ['COMPLIANCE', 'IT_ADMIN', 'MANAGEMENT'],
      '/management': ['MANAGEMENT', 'IT_ADMIN'],
      '/policy-processing': ['POLICY_PROCESSING', 'IT_ADMIN', 'MANAGEMENT'],
    };

    for (const [route, roles] of Object.entries(roleRestrictions)) {
      if (path.startsWith(route) && !roles.includes(role)) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/submissions/:path*',
    '/underwriting/:path*',
    '/senior-review/:path*',
    '/compliance/:path*',
    '/policy-processing/:path*',
    '/management/:path*',
    '/admin/:path*',
    '/api/submissions/:path*',
    '/api/documents/:path*',
    '/api/ai-recommendations/:path*',
    '/api/referrals/:path*',
    '/api/compliance/:path*',
    '/api/rules/:path*',
    '/api/policy-processing/:path*',
    '/api/users/:path*',
    '/api/exports/:path*',
    '/api/dashboard/:path*',
    '/api/audit-logs/:path*',
  ],
};
