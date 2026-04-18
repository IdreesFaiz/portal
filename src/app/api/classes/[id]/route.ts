import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { errorMessage, errorStatusCode } from "@/lib/error-message";
import { validateObjectId } from "@/lib/validate-id";
import { safeJson } from "@/lib/safe-json";
import { updateClassSchema, safeParse } from "@/lib/validation";
import {
  getClassByIdService,
  updateClassService,
  deleteClassService,
} from "@/services/classService";
import { sendResultAnnouncementEmails } from "@/services/emailService";
import type { RouteContext } from "@/types/route.types";

/** GET /api/classes/:id — returns a single class by id. */
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    await connectDB();
    const { id } = await context.params;
    validateObjectId(id, "Class");
    const cls = await getClassByIdService(id);
    return NextResponse.json({ success: true, data: cls });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: errorMessage(error) },
      { status: errorStatusCode(error) }
    );
  }
}

/** PUT /api/classes/:id — updates a class by id. */
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    await connectDB();
    const { id } = await context.params;
    validateObjectId(id, "Class");

    const jsonResult = await safeJson(req);
    if (jsonResult.error) return jsonResult.error;

    const parsed = safeParse(updateClassSchema, jsonResult.data);
    if (parsed.error !== undefined) {
      return NextResponse.json({ success: false, message: parsed.error }, { status: 400 });
    }

    const before = await getClassByIdService(id);
    const wasPreviouslyPublished = before.resultsPublished;

    const cls = await updateClassService(id, parsed.data);

    const justPublished = parsed.data.resultsPublished === true && !wasPreviouslyPublished;

    if (justPublished) {
      void sendResultAnnouncementEmails(id, cls.className, cls.year).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error(`[api] Email blast failed: ${msg}`);
      });
    }

    return NextResponse.json({
      success: true,
      data: cls,
      ...(justPublished ? { emailsSent: true } : {}),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: errorMessage(error) },
      { status: errorStatusCode(error) }
    );
  }
}

/** DELETE /api/classes/:id — deletes a class by id. */
export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    await connectDB();
    const { id } = await context.params;
    validateObjectId(id, "Class");
    await deleteClassService(id);
    return NextResponse.json({ success: true, message: "Class deleted" });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: errorMessage(error) },
      { status: errorStatusCode(error) }
    );
  }
}
