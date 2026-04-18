import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { errorMessage, errorStatusCode } from "@/lib/error-message";
import { validateObjectId } from "@/lib/validate-id";
import { safeJson } from "@/lib/safe-json";
import { promoteStudentsSchema, safeParse } from "@/lib/validation";
import { promoteStudentsService } from "@/services/classService";
import type { RouteContext } from "@/types/route.types";

/** POST /api/classes/:id/promote — moves all students to the target class. */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    await connectDB();
    const { id } = await context.params;
    validateObjectId(id, "Source Class");

    const jsonResult = await safeJson(req);
    if (jsonResult.error) return jsonResult.error;

    const parsed = safeParse(promoteStudentsSchema, jsonResult.data);
    if (parsed.error !== undefined) {
      return NextResponse.json({ success: false, message: parsed.error }, { status: 400 });
    }

    const { targetClassId } = parsed.data;
    const result = await promoteStudentsService(id, targetClassId);

    return NextResponse.json({
      success: true,
      message: `${result.promotedCount} student(s) promoted successfully`,
      data: result,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: errorMessage(error) },
      { status: errorStatusCode(error) }
    );
  }
}
