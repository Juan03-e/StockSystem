/**
 * middleware.ts — Route protection + role-based access control
 * Runs on every request to dashboard routes before page renders.
 */
import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { Role } from "@/types";

// Routes that require at least MANAGER role
const MANAGER_ONLY = ["/reports", "/products"];

// Routes that require ADMIN role
const ADMIN_ONLY = ["/users"];

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role as Role | undefined;

    if (!role) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // ADMIN_ONLY check
    if (ADMIN_ONLY.some((path) => pathname.startsWith(path))) {
      if (role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // MANAGER_ONLY check (ADMIN can access these too)
    if (MANAGER_ONLY.some((path) => pathname.startsWith(path))) {
      if (role === "EMPLOYEE") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
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
    "/dashboard/:path*",
    "/products/:path*",
    "/movements/:path*",
    "/alerts/:path*",
    "/reports/:path*",
    "/users/:path*",
  ],
};
