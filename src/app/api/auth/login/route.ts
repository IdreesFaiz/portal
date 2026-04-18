import { NextRequest, NextResponse } from "next/server";
import { authenticateAdmin, AUTH_COOKIE } from "@/lib/auth";
import { safeJson } from "@/lib/safe-json";
import { loginSchema, safeParse } from "@/lib/validation";

/** In-memory rate limiter — tracks login attempts per IP. */
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(ip: string): NextResponse | null {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (entry && now < entry.resetAt) {
    if (entry.count >= MAX_ATTEMPTS) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      return NextResponse.json(
        {
          success: false,
          message: `Too many login attempts. Try again in ${retryAfterSec} seconds.`,
        },
        { status: 429 }
      );
    }
    entry.count += 1;
  } else {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  }

  return null;
}

function resetRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}

/** POST /api/auth/login — authenticates admin with email + password. */
export async function POST(req: NextRequest) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(",")[0].trim()
      : (req.headers.get("x-real-ip") ?? "unknown");

    const rateLimited = checkRateLimit(ip);
    if (rateLimited) return rateLimited;

    const jsonResult = await safeJson(req);
    if (jsonResult.error) return jsonResult.error;

    const parsed = safeParse(loginSchema, jsonResult.data);
    if (parsed.error !== undefined) {
      return NextResponse.json({ success: false, message: parsed.error }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const token = await authenticateAdmin(email, password);

    resetRateLimit(ip);

    const response = NextResponse.json(
      { success: true, message: "Login successful" },
      { status: 200 }
    );

    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 30,
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ success: false, message }, { status: 401 });
  }
}
