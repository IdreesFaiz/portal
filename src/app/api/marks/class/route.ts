import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { errorMessage, errorStatusCode } from "@/lib/error-message";
import { validateObjectId } from "@/lib/validate-id";
import { getMarksByClassService } from "@/services/markService";

/** GET /api/marks/class?classId=... — returns all marks for every student in a class. */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const classId = new URL(req.url).searchParams.get("classId");

    if (!classId) {
      return NextResponse.json(
        { success: false, message: "classId is required" },
        { status: 400 }
      );
    }

    validateObjectId(classId, "Class");

    const marks = await getMarksByClassService(classId);
    return NextResponse.json({ success: true, data: marks });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: errorMessage(error) },
      { status: errorStatusCode(error) }
    );
  }
}
