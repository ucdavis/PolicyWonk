import { auth } from "@/auth";

export default auth((req: any) => {
  const url = req.nextUrl;
  const route = req.nextUrl.pathname;

  const isLoggedIn = !!req.auth;

  console.log("isLoggedIn: ", isLoggedIn);
  console.log("route: ", route, url);

  if (!isLoggedIn && !route.startsWith("/api/auth")) {
    console.log("redirecting to signin");
    return Response.redirect(new URL("/api/auth/signin", url));
  } else {
    return;
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
