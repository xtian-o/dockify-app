/**
 * Next.js Middleware - Route Protection
 *
 * This middleware runs before every request and handles:
 * - Authentication checks
 * - Route protection (redirect unauthenticated users)
 * - Session refresh (keep sessions alive)
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 * @see https://authjs.dev/getting-started/session-management/protecting
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Middleware Function
 *
 * Wraps Auth.js auth() function to add custom logic
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // ==================== ROUTE CONFIGURATION ====================

  /**
   * Public Routes
   * These routes are accessible to everyone (authenticated or not)
   */
  const _publicRoutes = [
    "/",
    "/info",
    "/health",
    "/api/health",
    "/api/debug",
  ];

  /**
   * Auth Routes
   * These routes are only for unauthenticated users
   * Logged-in users will be redirected to dashboard
   */
  const authRoutes = ["/sign-in", "/get-started"];

  /**
   * Protected Routes
   * These routes require authentication
   * Will be defined by route prefix
   */
  const protectedPrefixes = ["/dashboard", "/profile", "/settings"];

  // ==================== ROUTE MATCHING ====================

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );

  // ==================== AUTHENTICATION LOGIC ====================

  /**
   * If user is logged in and tries to access auth pages (sign-in, get-started)
   * Redirect to dashboard
   */
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  /**
   * If user is NOT logged in and tries to access protected routes
   * Redirect to sign-in with callback URL
   */
  if (!isLoggedIn && isProtectedRoute) {
    const signInUrl = new URL("/sign-in", req.nextUrl);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  /**
   * Check account status for logged-in users
   * Block suspended, deleted, or locked accounts
   */
  if (isLoggedIn && req.auth?.user) {
    const { status } = req.auth.user;

    if (status === "suspended" || status === "deleted" || status === "locked") {
      // Sign out the user
      const signOutUrl = new URL("/api/auth/signout", req.nextUrl);
      return NextResponse.redirect(signOutUrl);
    }
  }

  // ==================== ALLOW REQUEST ====================
  return NextResponse.next();
});

/**
 * Middleware Configuration
 *
 * Matcher defines which routes this middleware runs on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - Files with extensions (.png, .jpg, .svg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$).*)",
  ],
};
