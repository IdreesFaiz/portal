import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { connectDB } from "@/lib/db";
import { errorMessage } from "@/lib/error-message";
import { evaluateFinalResult } from "@/lib/result-status";
import {
  marksNeedReconciliation,
  reconcileCourseMarks,
  type StoredCourseMark,
} from "@/lib/marks-reconcile";
import ClassModel from "@/models/class";
import StudentModel from "@/models/student";
import MarkModel from "@/models/mark";
import type { Course } from "@/types/class.types";

interface CourseMarkDoc {
  courseName: string;
  totalMarks: number;
  obtainedMarks: number;
}

interface MarkDoc {
  studentId: string;
  courseMarks: CourseMarkDoc[];
}

/**
 * GET /api/student/export?year=2026
 * Generates an Excel workbook with one sheet per class.
 * Each sheet contains student info + course-wise marks + total + percentage + status.
 * Optional `year` query param filters classes by year.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const yearParam = req.nextUrl.searchParams.get("year");
    const classFilter: Record<string, unknown> = {};
    if (yearParam) {
      const parsed = Number(yearParam);
      if (Number.isNaN(parsed)) {
        return NextResponse.json(
          { success: false, message: "Invalid year parameter" },
          { status: 400 }
        );
      }
      classFilter.year = parsed;
    }

    const classes = await ClassModel.find(classFilter).sort({ year: -1, className: 1 }).lean();

    if (classes.length === 0) {
      return NextResponse.json(
        { success: false, message: "No classes found for the selected filter" },
        { status: 404 }
      );
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "School Management System";
    workbook.created = new Date();

    for (const cls of classes) {
      const classId = String(cls._id);
      const sheetName = `${String(cls.className)} (${cls.year})`.substring(0, 31);

      const students = await StudentModel.find({ classId }).sort({ rollNumber: 1 }).lean();
      const courses = cls.courses as Course[];

      const driftedOps: {
        updateOne: {
          filter: { _id: unknown };
          update: { $set: { courseMarks: StoredCourseMark[] } };
        };
      }[] = [];
      const rawMarks = (await MarkModel.find({ classId }).lean()) as unknown as (MarkDoc & {
        _id: unknown;
      })[];

      const marksMap = new Map<string, CourseMarkDoc[]>();
      for (const m of rawMarks) {
        let studentMarks = m.courseMarks;
        if (courses.length > 0 && marksNeedReconciliation(courses, studentMarks)) {
          const inferredOld: Course[] = studentMarks.map((cm) => ({
            name: cm.courseName,
            marks: cm.totalMarks,
          }));
          studentMarks = reconcileCourseMarks(inferredOld, courses, studentMarks);
          driftedOps.push({
            updateOne: {
              filter: { _id: m._id },
              update: { $set: { courseMarks: studentMarks } },
            },
          });
        }
        marksMap.set(String(m.studentId), studentMarks);
      }

      if (driftedOps.length > 0) {
        try {
          await MarkModel.bulkWrite(driftedOps);
        } catch {
          // Best-effort repair — export still uses the reconciled data in memory.
        }
      }
      const courseNames: string[] = courses.map((c) => c.name);
      const courseTotalByName = new Map<string, number>(
        courses.map((course) => [course.name, course.marks])
      );

      const sheet = workbook.addWorksheet(sheetName);

      const headerRow = [
        "#",
        "نام",
        "والد/والدہ",
        "رول نمبر",
        "رجسٹریشن نمبر",
        "ای میل",
        "فون",
        "شناختی کارڈ",
        ...courseNames.flatMap((name) => [`${name} (حاصل)`, `${name} (کل)`]),
        "کل حاصل",
        "کل نمبر",
        "فیصد",
        "حیثیت",
      ];

      sheet.addRow(headerRow);

      const headerStyle: Partial<ExcelJS.Style> = {
        font: { bold: true, color: { argb: "FFFFFFFF" }, size: 11 },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF16213E" } },
        alignment: { horizontal: "center", vertical: "middle", wrapText: true },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      };

      sheet.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });
      sheet.getRow(1).height = 30;

      students.forEach((student, idx) => {
        const studentId = String(student._id);
        const studentMarks = marksMap.get(studentId) ?? [];

        const courseData: number[] = [];
        const {
          totalObtained,
          totalMax,
          percentage,
          passed: finalPassed,
        } = evaluateFinalResult(studentMarks);

        for (const courseName of courseNames) {
          const cm = studentMarks.find((m) => m.courseName === courseName);
          const obtained = cm?.obtainedMarks ?? 0;
          const total = courseTotalByName.get(courseName) ?? 0;
          courseData.push(obtained, total);
        }
        const status = finalPassed ? "پاس" : "فیل";

        const row = sheet.addRow([
          idx + 1,
          student.name,
          student.parentName,
          student.rollNumber,
          student.registrationNumber,
          student.email,
          student.phone,
          student.CNIC,
          ...courseData,
          totalObtained,
          totalMax,
          `${percentage.toFixed(1)}%`,
          status,
        ]);

        const statusCell = row.getCell(headerRow.length);
        if (finalPassed) {
          statusCell.font = { bold: true, color: { argb: "FF16A34A" } };
        } else {
          statusCell.font = { bold: true, color: { argb: "FFDC2626" } };
        }

        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFE0E0E0" } },
            bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
            left: { style: "thin", color: { argb: "FFE0E0E0" } },
            right: { style: "thin", color: { argb: "FFE0E0E0" } },
          };
          cell.alignment = { horizontal: "center", vertical: "middle" };
        });
      });

      sheet.columns.forEach((col) => {
        col.width = 16;
      });
      const firstCol = sheet.getColumn(1);
      if (firstCol) firstCol.width = 5;
      const nameCol = sheet.getColumn(2);
      if (nameCol) nameCol.width = 22;
      const parentCol = sheet.getColumn(3);
      if (parentCol) parentCol.width = 22;

      if (students.length === 0) {
        sheet.addRow(["", "اس جماعت میں کوئی طالب علم نہیں"]);
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();

    const fileName = yearParam ? `students-results-${yearParam}.xlsx` : "students-results-all.xlsx";

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: errorMessage(error) }, { status: 500 });
  }
}
