import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/admin/dashboard/:path*']);
const isAccountRoute = createRouteMatcher(['/account/:path*', '/account']);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Protect account routes with Clerk
  if (isAccountRoute(req)) {
    await auth.protect();
  }

  // Protect admin routes with cookie session
  if (isAdminRoute(req)) {
    const session = req.cookies.get('cast-admin-session')?.value;
    if (!session || session !== 'authenticated') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
