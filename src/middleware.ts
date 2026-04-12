import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE } from "@/lib/auth";

/** API routes that are publicly accessible without authentication (any method). */
const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/student/lookup",
];

/** Public GET-only routes — POST/PUT/DELETE still require auth. */
const PUBLIC_GET_ONLY_ROUTES = [
  "/api/classes",
];

/** Dynamic public API patterns — matched with regex. */
const PUBLIC_API_PATTERNS: RegExp[] = [
  /^\/api\/student\/[a-f\d]{24}\/report$/i,
];

/** Checks if a request is publicly accessible. */
function isPublicApi(pathname: string, method: string): boolean {
  if (PUBLIC_API_ROUTES.includes(pathname)) return true;
  if (PUBLIC_GET_ONLY_ROUTES.includes(pathname) && method === "GET") return true;
  return PUBLIC_API_PATTERNS.some((pattern) => pattern.test(pathname));
}

/**
 * Middleware that protects all /admin and /api routes.
 * - /admin/login is accessible without auth (redirects to /admin if already logged in)
 * - Public API routes (login, logout, classes list, student lookup) are open
 * - All other /api/* and /admin/* routes require a valid JWT
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin/login") {
    const token = req.cookies.get(AUTH_COOKIE)?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
    }
    return NextResponse.next();
  }

  if (isPublicApi(pathname, req.method)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE)?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const payload = await verifyToken(token);

  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }
    const response = NextResponse.redirect(new URL("/admin/login", req.url));
    response.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
