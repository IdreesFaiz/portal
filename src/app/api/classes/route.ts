import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { errorMessage } from "@/lib/error-message";
import { createClassesController, getClassesController } from "@/controllers/classesController";

export async function GET() {
  await connectDB();
  const classesList = await getClassesController();
  return NextResponse.json(classesList);
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const data = await req.json();
    const createdClass = await createClassesController(data);
    return NextResponse.json({ success: true, class: createdClass }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: errorMessage(error) },
      { status: 500 }
    );
  }
}
