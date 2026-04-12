import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { errorMessage, errorStatusCode } from "@/lib/error-message";
import { safeJson } from "@/lib/safe-json";
import { bulkUpsertMarksSchema, safeParse } from "@/lib/validation";
import { bulkUpsertMarksService } from "@/services/markService";

/** POST /api/marks/bulk — bulk upsert marks for multiple students in a class. */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const jsonResult = await safeJson(req);
    if (jsonResult.error) return jsonResult.error;

    const parsed = safeParse(bulkUpsertMarksSchema, jsonResult.data);
    if (parsed.error !== undefined) {
      return NextResponse.json(
        { success: false, message: parsed.error },
        { status: 400 }
      );
    }

    const result = await bulkUpsertMarksService(parsed.data.entries);
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
