import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const path = req.nextUrl.pathname;

    if (path.startsWith("/vendor") && token?.role !== "VENDOR") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (path.startsWith("/client") && token?.role !== "CLIENT") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: ["/vendor/:path*", "/client/:path*"],
};
