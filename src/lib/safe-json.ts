import { NextRequest, NextResponse } from "next/server";

/**
 * Safely parses JSON from a NextRequest body.
 * Returns the parsed object on success, or a 400 NextResponse on failure.
 */
export async function safeJson(
  req: NextRequest
): Promise<{ data: unknown; error?: undefined } | { data?: undefined; error: NextResponse }> {
  try {
    const data: unknown = await req.json();
    return { data };
  } catch {
    return {
      error: NextResponse.json(
        { success: false, message: "Invalid or missing JSON body" },
        { status: 400 }
      ),
    };
  }
}
