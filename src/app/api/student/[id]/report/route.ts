import { NextRequest, NextResponse } from "next/server";
import puppeteer, { type Browser } from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { connectDB } from "@/lib/db";
import { errorMessage, errorStatusCode } from "@/lib/error-message";
import { validateObjectId } from "@/lib/validate-id";
import { getStudentByIdService } from "@/services/studentService";
import { getMarksByStudentAndClassService } from "@/services/markService";
import type { CourseMark } from "@/types/mark.types";
import type { RouteContext } from "@/types/route.types";

export const runtime = "nodejs";
export const maxDuration = 30;

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

let globalBrowser: Browser | null = null;

async function getReusableBrowser(): Promise<Browser> {
  if (globalBrowser && globalBrowser.isConnected()) {
    return globalBrowser;
  }

  const executablePath = await chromium.executablePath();

  globalBrowser = await puppeteer.launch({
    args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
    executablePath,
    headless: true,
    defaultViewport: {
      width: 1200,
      height: 800,
    },
  });

  return globalBrowser;
}

function buildReportHTML(
  student: Record<string, unknown>,
  classInfo: Record<string, unknown>,
  courseMarks: CourseMark[],
  totalObtained: number,
  totalMax: number,
  percentage: number
): string {
  const studentName = esc(String(student.name ?? ""));
  const rollNumber = esc(String(student.rollNumber ?? ""));
  const email = esc(String(student.email ?? ""));
  const registrationNumber = esc(String(student.registrationNumber ?? ""));
  const className = esc(String(classInfo.className ?? ""));

  const courseRows = courseMarks
    .map(
      (cm) => `
      <tr>
        <td>${esc(cm.courseName)}</td>
        <td>${cm.totalMarks}</td>
        <td>${cm.obtainedMarks}</td>
        <td>${
          cm.totalMarks > 0
            ? ((cm.obtainedMarks / cm.totalMarks) * 100).toFixed(1)
            : "0.0"
        }%</td>
      </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ur">
<head>
<meta charset="UTF-8" />
<style>
body { font-family: Arial; padding: 40px; direction: rtl; }
h1 { text-align: center; }
table { width: 100%; border-collapse: collapse; margin-top: 20px; }
th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
th { background: #333; color: #fff; }
</style>
</head>
<body>

<h1>رپورٹ کارڈ</h1>

<p>نام: ${studentName}</p>
<p>رول نمبر: ${rollNumber}</p>
<p>رجسٹریشن نمبر: ${registrationNumber}</p>
<p>ای میل: ${email}</p>
<p>کلاس: ${className}</p>

<table>
<thead>
<tr>
<th>مضمون</th>
<th>کل نمبر</th>
<th>حاصل نمبر</th>
<th>فیصد</th>
</tr>
</thead>
<tbody>
${courseRows}
</tbody>
</table>

<h3>کل نمبر: ${totalObtained} / ${totalMax}</h3>
<h3>فیصد: ${percentage.toFixed(1)}%</h3>
<h3>نتیجہ: ${percentage >= 50 ? "پاس" : "فیل"}</h3>

</body>
</html>`;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  let page: Awaited<ReturnType<Browser["newPage"]>> | null = null;

  try {
    await connectDB();

    const { id } = await context.params;
    validateObjectId(id, "Student");

    const student = await getStudentByIdService(id);
    const studentObj = student.toObject() as Record<string, unknown>;

    const classInfo = (studentObj.classId ?? {}) as Record<string, unknown>;
    const classId = String(classInfo._id ?? "");

    const marksDoc = await getMarksByStudentAndClassService(id, classId);

    const courseMarks: CourseMark[] = marksDoc
      ? ((marksDoc.toObject() as Record<string, unknown>).courseMarks as CourseMark[])
      : [];

    const totalObtained = courseMarks.reduce((s, c) => s + c.obtainedMarks, 0);
    const totalMax = courseMarks.reduce((s, c) => s + c.totalMarks, 0);
    const percentage = totalMax ? (totalObtained / totalMax) * 100 : 0;

    const html = buildReportHTML(
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

    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="report-${id}.pdf"`,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: errorMessage(error) },
      { status: errorStatusCode(error) }
    );
  } finally {
    if (page) await page.close();
  }
}