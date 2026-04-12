import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { errorMessage, errorStatusCode } from "@/lib/error-message";
import { validateObjectId } from "@/lib/validate-id";
import { getStudentsByClassService } from "@/services/studentService";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** GET /api/classes/:id/students — returns all students in a specific class. */
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    await connectDB();
    const { id } = await context.params;
    validateObjectId(id, "Class");
    const students = await getStudentsByClassService(id);
    return NextResponse.json({ success: true, data: students });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: errorMessage(error) },
      { status: errorStatusCode(error) }
    );
  }
}
