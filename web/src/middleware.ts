import { auth } from './auth';

const unprotectedRoutes = ['/api/auth', '/auth', '/api/documents'];

export default auth((req: any) => {
  const url = req.nextUrl;
  const route = req.nextUrl.pathname;

  const isLoggedIn = !!req.auth;

  if (!isLoggedIn) {
    // auth routes are unprotected
    if (unprotectedRoutes.some((pattern) => route.startsWith(pattern))) {
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
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
