import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { errorMessage, errorStatusCode } from "@/lib/error-message";
import { validateObjectId } from "@/lib/validate-id";
import StudentModel from "@/models/student";
import ClassModel from "@/models/class";
import { getMarksByStudentAndClassService } from "@/services/markService";

/**
 * GET /api/student/lookup?classId=xxx&rollNumber=yyy
 * Public endpoint — finds a student by class + roll number.
 * Only returns marks if the class has resultsPublished=true.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const classId = req.nextUrl.searchParams.get("classId");
    const rollNumber = req.nextUrl.searchParams.get("rollNumber");

    if (!classId || !rollNumber) {
      return NextResponse.json(
        { success: false, message: "classId and rollNumber are required" },
        { status: 400 }
      );
    }

    validateObjectId(classId, "Class");

    const classDoc = await ClassModel.findById(classId);

    if (!classDoc) {
      return NextResponse.json({ success: false, message: "Class not found" }, { status: 404 });
    }

    if (!classDoc.resultsPublished) {
      return NextResponse.json(
        {
          success: false,
          message: "Results for this class have not been published yet. Please check back later.",
        },
        { status: 403 }
      );
    }

    const student = await StudentModel.findOne({
      classId,
      rollNumber: {
        $regex: new RegExp(`^${rollNumber.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      },
    }).populate("classId", "className courses year resultsPublished");

    if (!student) {
      return NextResponse.json(
        { success: false, message: "No student found with this roll number in the selected class" },
        { status: 404 }
      );
    }

    const marks = await getMarksByStudentAndClassService(String(student._id), classId);

    const studentObj = student.toObject() as Record<string, unknown>;
    const studentClass = (studentObj.classId ?? {}) as Record<string, unknown>;

    return NextResponse.json({
      success: true,
      data: {
        student: {
          _id: String(studentObj._id ?? ""),
          name: studentObj.name,
          rollNumber: studentObj.rollNumber,
          registrationNumber: studentObj.registrationNumber,
          // Personal details exposed so the public result card can mirror the
          // printable PDF layout (نام امیدوار / ولدیت / شناختی کارڈ / فون).
          // Lookup still requires classId + rollNumber, so this is intentional
          // — admins should restrict this further if privacy regulations apply.
          parentName: studentObj.parentName,
          CNIC: studentObj.CNIC,
          phone: studentObj.phone,
          classId: {
            className: studentClass.className,
            year: studentClass.year,
            courses: studentClass.courses,
            resultsPublished: studentClass.resultsPublished,
          },
        },
        marks: marks ? marks.toObject() : null,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: errorMessage(error) },
      { status: errorStatusCode(error) }
    );
  }
}
