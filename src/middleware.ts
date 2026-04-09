import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasCookie = Boolean(getSessionCookie(request));

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/monitors") ||
    pathname.startsWith("/settings")
  ) {
    if (!hasCookie) {
      const u = new URL("/login", request.nextUrl);
      u.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(u);
    }
  }

  if (
    (pathname === "/login" ||
      pathname === "/signup" ||
      pathname === "/verify-email") &&
    hasCookie
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/monitors/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
    "/verify-email",
  ],
};
