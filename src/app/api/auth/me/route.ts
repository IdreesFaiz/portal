import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE } from "@/lib/auth";

/**
 * GET /api/auth/me — returns the authenticated admin's info.
 * Used by the client to check if the user is logged in.
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { success: false, message: "Invalid or expired token" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { email: payload.email, role: payload.role },
  });
}
