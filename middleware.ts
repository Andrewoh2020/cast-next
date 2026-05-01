import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/admin/dashboard/:path*']);
const isAccountRoute = createRouteMatcher(['/account/:path*', '/account']);
const isCreateRoute = createRouteMatcher(['/create/:path*', '/create']);
const isStudioRoute = createRouteMatcher(['/studio/:path*', '/studio']);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Canonical host: redirect apex castability.ai to www.castability.ai
  const host = req.headers.get('host');
  if (host === 'castability.ai') {
    const url = new URL(req.url);
    url.host = 'www.castability.ai';
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301);
  }

  // Protect account, create, and studio routes with Clerk
  if (isAccountRoute(req) || isCreateRoute(req) || isStudioRoute(req)) {
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
