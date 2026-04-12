import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { errorMessage, errorStatusCode } from "@/lib/error-message";
import { getDraftStudentsService } from "@/services/studentService";

/**
 * GET /api/student/drafts
 * Returns all students with no assigned class (draft state).
 */
export async function GET() {
  try {
    await connectDB();
    const students = await getDraftStudentsService();
    return NextResponse.json({ success: true, data: students });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: errorMessage(error) },
      { status: errorStatusCode(error) }
    );
  }
}
