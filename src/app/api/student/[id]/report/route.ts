import { NextRequest, NextResponse } from "next/server";
import puppeteer, { type Browser, type Page } from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { connectDB } from "@/lib/db";
import { errorMessage, errorStatusCode } from "@/lib/error-message";
import { validateObjectId } from "@/lib/validate-id";
import { evaluateFinalResult } from "@/lib/result-status";
import { getStudentByIdService } from "@/services/studentService";
import { getMarksByStudentAndClassService } from "@/services/markService";
import type { CourseMark } from "@/types/mark.types";
import type { Course } from "@/types/class.types";
import type { RouteContext } from "@/types/route.types";

export const runtime = "nodejs";
export const maxDuration = 30;

let globalBrowser: Browser | null = null;

interface LaunchCandidate {
  executablePath: string;
  useChromiumFlags: boolean;
}

async function fileExists(path: string): Promise<boolean> {
  const fs = await import("fs/promises");
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function getLaunchCandidates(puppeteerExecutablePath?: string): Promise<LaunchCandidate[]> {
  const candidates: LaunchCandidate[] = [];

  if (puppeteerExecutablePath) {
    candidates.push({
      executablePath: puppeteerExecutablePath,
      useChromiumFlags: false,
    });
  }

  const isProductionLike = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  if (!isProductionLike) {
    const localPaths = [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    ];

    for (const path of localPaths) {
      if (await fileExists(path)) {
        candidates.push({ executablePath: path, useChromiumFlags: false });
      }
    }
  }

  const sparticuzPath = await chromium.executablePath();
  if (sparticuzPath) {
    candidates.push({ executablePath: sparticuzPath, useChromiumFlags: true });
  }

  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate.executablePath)) return false;
    seen.add(candidate.executablePath);
    return true;
  });
}

async function getReusableBrowser(puppeteerExecutablePath?: string): Promise<Browser> {
  try {
    if (globalBrowser && globalBrowser.isConnected()) {
      return globalBrowser;
    }

    const baseFlags = ["--hide-scrollbars", "--disable-web-security", "--disable-dev-shm-usage"];
    const candidates = await getLaunchCandidates(puppeteerExecutablePath);

    let lastError: unknown = null;
    for (const candidate of candidates) {
      try {
        const args = candidate.useChromiumFlags ? [...chromium.args, ...baseFlags] : baseFlags;
        globalBrowser = await puppeteer.launch({
          headless: true,
          executablePath: candidate.executablePath,
          args,
        });
        break;
      } catch (error) {
        lastError = error;
        globalBrowser = null;
      }
    }

    if (!globalBrowser) {
      if (lastError instanceof Error) {
        throw new Error(`Failed to launch browser for PDF generation: ${lastError.message}`);
      }
      throw new Error("Failed to launch browser for PDF generation");
    }

    globalBrowser.on("disconnected", () => {
      globalBrowser = null;
    });

    return globalBrowser;
  } catch (err) {
    globalBrowser = null;
    throw err;
  }
}

/** Escapes HTML special chars to prevent injection in the PDF template. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Builds the HTML report card template in Urdu with RTL layout.
 * All user-supplied strings are escaped before interpolation.
 */
function buildReportHTML(
  student: Record<string, unknown>,
  classInfo: Record<string, unknown>,
  courseMarks: CourseMark[],
  totalObtained: number,
  totalMax: number,
  percentage: number,
  passed: boolean
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
        <td>${cm.totalMarks > 0 ? ((cm.obtainedMarks / cm.totalMarks) * 100).toFixed(1) : "0.0"}%</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html dir="rtl" lang="ur">
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a1a2e; background: #fff; direction: rtl; }
    .header { text-align: center; border-bottom: 3px solid #16213e; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 28px; color: #16213e; margin-bottom: 4px; }
    .header p { font-size: 14px; color: #555; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 30px; }
    .info-item { display: flex; gap: 8px; }
    .info-item .label { font-weight: 600; color: #16213e; min-width: 140px; }
    .info-item .value { color: #333; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #16213e; color: #fff; padding: 10px 14px; text-align: right; font-size: 13px; letter-spacing: 0.5px; }
    td { padding: 10px 14px; border-bottom: 1px solid #e0e0e0; font-size: 14px; text-align: right; }
    tr:nth-child(even) td { background: #f7f8fc; }
    .summary { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 30px; }
    .summary-card { background: #f0f4ff; border-radius: 8px; padding: 16px; text-align: center; }
    .summary-card .number { font-size: 28px; font-weight: 700; color: #16213e; }
    .summary-card .desc { font-size: 12px; color: #666; margin-top: 4px; letter-spacing: 0.5px; }
    .footer { text-align: center; padding-top: 20px; border-top: 2px solid #e0e0e0; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>رپورٹ کارڈ</h1>
    <p>اسکول مینجمنٹ سسٹم</p>
  </div>

  <div class="info-grid">
    <div class="info-item"><span class="label">طالب علم کا نام:</span><span class="value">${studentName}</span></div>
    <div class="info-item"><span class="label">رول نمبر:</span><span class="value">${rollNumber}</span></div>
    <div class="info-item"><span class="label">رجسٹریشن نمبر:</span><span class="value">${registrationNumber}</span></div>
    <div class="info-item"><span class="label">ای میل:</span><span class="value">${email}</span></div>
    <div class="info-item"><span class="label">جماعت:</span><span class="value">${className}</span></div>
  </div>

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

  <div class="summary">
    <div class="summary-card">
      <div class="number">${totalObtained} / ${totalMax}</div>
      <div class="desc">کل نمبر</div>
    </div>
    <div class="summary-card">
      <div class="number">${percentage.toFixed(1)}%</div>
      <div class="desc">فیصد</div>
    </div>
    <div class="summary-card">
      <div class="number">${passed ? "پاس" : "فیل"}</div>
      <div class="desc">حیثیت</div>
    </div>
  </div>

  <div class="footer">
    <p>تاریخ اجراء: ${new Date().toLocaleDateString("ur-PK", { year: "numeric", month: "long", day: "numeric" })}</p>
  </div>
</body>
</html>`;
}

/** GET /api/student/:id/report — generates a PDF report card for the student. */
export async function GET(_req: NextRequest, context: RouteContext) {
  let page: Page | null = null;

  try {
    await connectDB();
    const { id } = await context.params;
    validateObjectId(id, "Student");

    const student = await getStudentByIdService(id);
    const studentObj = student.toObject() as Record<string, unknown>;
    const classInfo = (studentObj.classId ?? {}) as Record<string, unknown>;
    const isPublished = classInfo.resultsPublished === true;
    if (!isPublished) {
      return NextResponse.json(
        {
          success: false,
          message: "Results for this class have not been published yet.",
        },
        { status: 403 }
      );
    }
    const classId = String(classInfo._id ?? "");

    const marksDoc = await getMarksByStudentAndClassService(id, classId);

    const courseMarks: CourseMark[] = marksDoc
      ? ((marksDoc.toObject() as Record<string, unknown>).courseMarks as CourseMark[])
      : [];
    const courses = Array.isArray(classInfo.courses) ? (classInfo.courses as Course[]) : [];
    const marksByCourseName = new Map<string, CourseMark>(
      courseMarks.map((mark) => [mark.courseName, mark])
    );
    const { totalObtained, totalMax, percentage, passed } = evaluateFinalResult(
      courses,
      marksByCourseName
    );

    const html = buildReportHTML(
      studentObj,
      classInfo,
      courseMarks,
      totalObtained,
      totalMax,
      percentage,
      passed
    );

    const browser = await getReusableBrowser(process.env.CHROME_PATH);
    page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 0 });
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      width: "1440px",
      printBackground: true,
      margin: { top: "50px", bottom: "64px" },
    });

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="report-${String(studentObj.rollNumber ?? id)}.pdf"`,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: errorMessage(error) },
      { status: errorStatusCode(error) }
    );
  } finally {
    if (page) {
      await page.close();
    }
  }
}
