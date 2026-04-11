// src/app/api/students/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { errorMessage } from "@/lib/error-message";
import { createStudentController, getStudentsController } from "@/controllers/studentController";

export async function GET() {
  await connectDB();
  const students = await getStudentsController();
  return NextResponse.json({ success: true, data: students });
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const data = await req.json();
    const student = await createStudentController(data);
    return NextResponse.json({ success: true, student }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: errorMessage(error) },
      { status: 500 }
    );
  }
}