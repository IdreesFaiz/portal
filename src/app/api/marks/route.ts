import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { errorMessage, errorStatusCode } from "@/lib/error-message";
import { validateObjectId } from "@/lib/validate-id";
import { safeJson } from "@/lib/safe-json";
import { upsertMarkSchema, safeParse } from "@/lib/validation";
import {
  upsertMarkService,
  getMarksByStudentAndClassService,
} from "@/services/markService";

/** GET /api/marks?studentId=...&classId=... — returns marks for a student in a class. */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const classId = searchParams.get("classId");

    if (!studentId || !classId) {
      return NextResponse.json(
        { success: false, message: "studentId and classId are required" },
        { status: 400 }
      );
    }

    validateObjectId(studentId, "Student");
    validateObjectId(classId, "Class");

    const marks = await getMarksByStudentAndClassService(studentId, classId);
    return NextResponse.json({ success: true, data: marks });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: errorMessage(error) },
      { status: errorStatusCode(error) }
    );
  }
}

/** POST /api/marks — creates or updates marks for a student in a class. */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const jsonResult = await safeJson(req);
    if (jsonResult.error) return jsonResult.error;

    const parsed = safeParse(upsertMarkSchema, jsonResult.data);
    if (parsed.error !== undefined) {
      return NextResponse.json(
        { success: false, message: parsed.error },
        { status: 400 }
      );
    }

    const result = await upsertMarkService(parsed.data);
    return NextResponse.json(
      { success: true, data: result },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: errorMessage(error) },
      { status: errorStatusCode(error) }
    );
  }
}
