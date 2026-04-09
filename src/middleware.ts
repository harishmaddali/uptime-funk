import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthed = !!req.auth;

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/monitors") ||
    pathname.startsWith("/settings")
  ) {
    if (!isAuthed) {
      const u = new URL("/login", req.nextUrl);
      u.searchParams.set("callbackUrl", pathname);
      return Response.redirect(u);
    }
  }

  if ((pathname === "/login" || pathname === "/signup") && isAuthed) {
    return Response.redirect(new URL("/dashboard", req.nextUrl));
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/monitors/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
  ],
};
