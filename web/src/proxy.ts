import { auth } from './auth';
import { isApplicationSession } from './lib/session';

const unprotectedRoutes = ['/api/auth', '/auth', '/api/documents'];

const externalApiRoutes = ['/api/chat/completions'];

export default auth((req: any) => {
  const url = req.nextUrl;
  const route = req.nextUrl.pathname;

  const isLoggedIn = isApplicationSession(req.auth);

  if (!isLoggedIn) {
    // auth routes are unprotected
    if (unprotectedRoutes.some((pattern) => route.startsWith(pattern))) {
      return;
    } else if (externalApiRoutes.some((pattern) => route.startsWith(pattern))) {
      // allow access to external API routes
      return;
    } else {
      // redirect to login page with callbackUrl
      const callbackUrl = new URL(route, url).toString();
      return Response.redirect(
        new URL(
          `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
          url
        )
      );
    }
  }

  // user is logged in, allow access
  return;
});

export const config = {
  // Chat authenticates in its route handler. Proxy body cloning waits for the
  // entire upload, which would postpone that handler's body and request timers.
  matcher: [
    '/((?!api/chat$|.+\\.[\\w]+$|_next).*)',
    '/',
    '/api/((?!chat$).*)',
    '/trpc(.*)',
  ],
};
