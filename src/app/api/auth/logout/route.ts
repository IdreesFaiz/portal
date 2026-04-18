import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

/**
 * POST /api/auth/logout — clears the admin auth cookie.
 */
export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out" }, { status: 200 });

  response.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
