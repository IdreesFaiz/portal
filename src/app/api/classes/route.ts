import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  createClassController,
  getClassesController,
} from "@/controllers/classController";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    console.log("CLASS BODY:", body);

    const result = await createClassController(body);

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("CLASS ERROR:", error);

    return NextResponse.json(
      { message: error.message || "Error creating class" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    const data = await getClassesController();

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Error fetching classes" },
      { status: 500 }
    );
  }
}