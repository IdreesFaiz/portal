import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { errorMessage } from "@/lib/error-message";
import { createCourseController, getCoursesController } from "@/controllers/courseController";

export async function GET() {
  await connectDB();
  const courses = await getCoursesController();
  return NextResponse.json(courses);
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const data = await req.json();
    const created = await createCourseController(data);
    return NextResponse.json({ success: true, course: created }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: errorMessage(error) },
      { status: 500 }
    );
  }
}
