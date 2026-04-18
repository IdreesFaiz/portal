import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { errorMessage, errorStatusCode } from "@/lib/error-message";
import { safeJson } from "@/lib/safe-json";
import { createStudentSchema, safeParse } from "@/lib/validation";
import { createStudentService, getStudentsService } from "@/services/studentService";

/** GET /api/student — returns all students with populated class info. */
export async function GET() {
  try {
    await connectDB();
    const students = await getStudentsService();
    return NextResponse.json({ success: true, data: students });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: errorMessage(error) },
      { status: errorStatusCode(error) }
    );
  }
}

/** POST /api/student — creates a new student. */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const jsonResult = await safeJson(req);
    if (jsonResult.error) return jsonResult.error;

    const parsed = safeParse(createStudentSchema, jsonResult.data);
    if (parsed.error !== undefined) {
      return NextResponse.json({ success: false, message: parsed.error }, { status: 400 });
    }

    const student = await createStudentService(parsed.data);
    return NextResponse.json({ success: true, data: student }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: errorMessage(error) },
      { status: errorStatusCode(error) }
    );
  }
}
