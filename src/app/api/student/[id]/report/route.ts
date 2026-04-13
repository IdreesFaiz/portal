import { NextRequest, NextResponse } from "next/server";
import puppeteer, { type Browser, type Page } from "puppeteer-core";
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

let globalBrowser: Browser | null = null;

/**
 * 🔥 Stable browser launcher (Vercel + local)
 */
async function getBrowser(): Promise<Browser> {
  try {
    if (globalBrowser && globalBrowser.isConnected()) {
      return globalBrowser;
    }

    const isLocal = process.env.NODE_ENV === "development";

    const executablePath = isLocal
      ? process.env.PUPPETEER_EXECUTABLE_PATH
      : await chromium.executablePath();

    const args = isLocal
      ? ["--no-sandbox", "--disable-setuid-sandbox"]
      : [...chromium.args, "--hide-scrollbars", "--disable-dev-shm-usage"];

    globalBrowser = await puppeteer.launch({
      headless: true,
      executablePath,
      args,
    });

    return globalBrowser;
  } catch (error) {
    globalBrowser = null;
    throw error;
  }
}

/**
 * Escape HTML
 */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * HTML Template
 */
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
  const className = esc(String(classInfo.className ?? ""));

  const rows = courseMarks
    .map(
      (cm) => `
      <tr>
        <td>${esc(cm.courseName)}</td>
        <td>${cm.totalMarks}</td>
        <td>${cm.obtainedMarks}</td>
        <td>${((cm.obtainedMarks / cm.totalMarks) * 100 || 0).toFixed(1)}%</td>
      </tr>`
    )
    .join("");

  return `
  <html dir="rtl">
  <body style="font-family:sans-serif;padding:40px">
    <h1 style="text-align:center">رپورٹ کارڈ</h1>

    <p>نام: ${studentName}</p>
    <p>رول نمبر: ${rollNumber}</p>
    <p>جماعت: ${className}</p>

    <table border="1" width="100%" cellspacing="0" cellpadding="8">
      <tr>
        <th>مضمون</th>
        <th>کل</th>
        <th>حاصل</th>
        <th>%</th>
      </tr>
      ${rows}
    </table>

    <h3>کل: ${totalObtained} / ${totalMax}</h3>
    <h3>فیصد: ${percentage.toFixed(1)}%</h3>
  </body>
  </html>
  `;
}

/**
 * API Route
 */
export async function GET(_req: NextRequest, context: RouteContext) {
  let page: Page | null = null;

  try {
    await connectDB();

    const { id } = context.params;
    validateObjectId(id, "Student");

    const student = await getStudentByIdService(id);
    const studentObj = student.toObject() as Record<string, unknown>;

    const classInfo = (studentObj.classId ?? {}) as Record<string, unknown>;
    const classId = String(classInfo._id ?? "");

    const marksDoc = await getMarksByStudentAndClassService(id, classId);

    const courseMarks: CourseMark[] = marksDoc
      ? (marksDoc.toObject().courseMarks as CourseMark[])
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

    const browser = await getBrowser();
    page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 800 });

    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 20000, // prevent hanging
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="report-${id}.pdf"`,

        // 🚀 CDN caching
        "Cache-Control":
          "public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("PDF ERROR:", error);

    return NextResponse.json(
      { success: false, message: errorMessage(error) },
      { status: errorStatusCode(error) }
    );
  } finally {
    if (page) await page.close();
  }
}
