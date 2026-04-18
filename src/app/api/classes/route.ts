import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { errorMessage, errorStatusCode } from "@/lib/error-message";
import { safeJson } from "@/lib/safe-json";
import { createClassSchema, safeParse } from "@/lib/validation";
import { createClassService, getClassesService } from "@/services/classService";

/** GET /api/classes — returns all classes. */
export async function GET() {
  try {
    await connectDB();
    const data = await getClassesService();
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: errorMessage(error) },
      { status: errorStatusCode(error) }
    );
  }
}

/** POST /api/classes — creates a new class (requires auth via middleware). */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const jsonResult = await safeJson(req);
    if (jsonResult.error) return jsonResult.error;

    const parsed = safeParse(createClassSchema, jsonResult.data);
    if (parsed.error !== undefined) {
      return NextResponse.json({ success: false, message: parsed.error }, { status: 400 });
    }

    const result = await createClassService(parsed.data);
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: errorMessage(error) },
      { status: errorStatusCode(error) }
    );
  }
}
