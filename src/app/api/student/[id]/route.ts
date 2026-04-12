import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { errorMessage, errorStatusCode } from "@/lib/error-message";
import { validateObjectId } from "@/lib/validate-id";
import { safeJson } from "@/lib/safe-json";
import { updateStudentSchema, safeParse } from "@/lib/validation";
import {
  getStudentByIdService,
  updateStudentService,
  deleteStudentService,
} from "@/services/studentService";
import type { RouteContext } from "@/types/route.types";

/** GET /api/student/:id — returns a single student by id. */
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    await connectDB();
    const { id } = await context.params;
    validateObjectId(id, "Student");
    const student = await getStudentByIdService(id);
    return NextResponse.json({ success: true, data: student });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: errorMessage(error) },
      { status: errorStatusCode(error) }
    );
  }
}

/** PUT /api/student/:id — updates a student by id. */
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    await connectDB();
    const { id } = await context.params;
    validateObjectId(id, "Student");

    const jsonResult = await safeJson(req);
    if (jsonResult.error) return jsonResult.error;

    const parsed = safeParse(updateStudentSchema, jsonResult.data);
    if (parsed.error !== undefined) {
      return NextResponse.json(
        { success: false, message: parsed.error },
        { status: 400 }
      );
    }

    const student = await updateStudentService(id, parsed.data);
    return NextResponse.json({ success: true, data: student });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: errorMessage(error) },
      { status: errorStatusCode(error) }
    );
  }
}

/** DELETE /api/student/:id — deletes a student by id. */
export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    await connectDB();
    const { id } = await context.params;
    validateObjectId(id, "Student");
    await deleteStudentService(id);
    return NextResponse.json({ success: true, message: "Student deleted" });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: errorMessage(error) },
      { status: errorStatusCode(error) }
    );
  }
}
