import { NextRequest, NextResponse } from "next/server";
import { getReusableBrowser } from "@/lib/browser";
import { connectDB } from "@/lib/db";
import { validateObjectId } from "@/lib/validate-id";
import { getStudentByIdService } from "@/services/studentService";
import { getMarksByStudentAndClassService } from "@/services/markService";
import type { RouteContext } from "@/types/route.types";
import type { CourseMark } from "@/types/mark.types";

export const runtime = "nodejs";
export const maxDuration = 30;

/* ---------------- ESCAPE HTML ---------------- */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ---------------- HTML BUILDER ---------------- */
function buildHTML(
  student: any,
  classInfo: any,
  courseMarks: CourseMark[],
  totalObtained: number,
  totalMax: number,
  percentage: number
) {
  const rows = courseMarks
    .map(
      (c) => `
      <tr>
        <td>${esc(c.courseName)}</td>
        <td>${c.totalMarks}</td>
        <td>${c.obtainedMarks}</td>
        <td>${((c.obtainedMarks / c.totalMarks) * 100).toFixed(1)}%</td>
      </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ur">
<head>
<meta charset="UTF-8" />
<style>
body { font-family: Arial; padding: 40px; }
h1 { text-align: center; }
table { width: 100%; border-collapse: collapse; margin-top: 20px; }
th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
th { background: #333; color: #fff; }
</style>
</head>
<body>

<h1>رپورٹ کارڈ</h1>

<p>نام: ${esc(student.name)}</p>
<p>رول نمبر: ${esc(student.rollNumber)}</p>
<p>کلاس: ${esc(classInfo.className)}</p>

<table>
<thead>
<tr>
<th>سبجیکٹ</th>
<th>کل نمبر</th>
<th>حاصل نمبر</th>
<th>فیصد</th>
</tr>
</thead>
<tbody>
${rows}
</tbody>
</table>

<h3>کل حاصل: ${totalObtained} / ${totalMax}</h3>
<h3>فیصد: ${percentage.toFixed(1)}%</h3>
<h3>نتیجہ: ${percentage >= 50 ? "پاس" : "فیل"}</h3>

</body>
</html>`;
}

/* ---------------- API ---------------- */
export async function GET(req: NextRequest, context: RouteContext) {
  let page = null;

  try {
    await connectDB();

    const { id } = context.params;
    validateObjectId(id, "Student");

    const student = await getStudentByIdService(id);
    const studentObj = student.toObject();

    const classInfo = studentObj.classId;
    const classId = String(classInfo._id);

    const marksDoc = await getMarksByStudentAndClassService(id, classId);

    const courseMarks: CourseMark[] =
      marksDoc?.toObject()?.courseMarks || [];

    const totalObtained = courseMarks.reduce((a, b) => a + b.obtainedMarks, 0);
    const totalMax = courseMarks.reduce((a, b) => a + b.totalMarks, 0);
    const percentage = totalMax ? (totalObtained / totalMax) * 100 : 0;

    const html = buildHTML(
      studentObj,
      classInfo,
      courseMarks,
      totalObtained,
      totalMax,
      percentage
    );

    const browser = await getReusableBrowser();
    page = await browser.newPage();

    await page.setViewport({ width: 1200, height: 800 });

    /* ⭐ SAME AS WORKING CODE */
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="report-${id}.pdf"`,

        // optional caching like reference code
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  } finally {
    if (page) await page.close();
  }
}