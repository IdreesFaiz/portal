import { NextRequest, NextResponse } from "next/server";
import puppeteer, { type Browser } from "puppeteer-core";
import chromium from "@sparticuz/chromium";

import { connectDB } from "@/lib/db";
import { validateObjectId } from "@/lib/validate-id";
import { getStudentByIdService } from "@/services/studentService";
import { getMarksByStudentAndClassService } from "@/services/markService";

import type { RouteContext } from "@/types/route.types";
import type { CourseMark } from "@/types/mark.types";

export const runtime = "nodejs";
export const maxDuration = 30;

/* ---------------------------
   Browser Singleton (Vercel safe)
---------------------------- */
let globalBrowser: Browser | null = null;

async function getBrowser() {
  if (globalBrowser && globalBrowser.isConnected()) {
    return globalBrowser;
  }

  const executablePath =
    process.env.CHROME_PATH || (await chromium.executablePath());

  globalBrowser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: process.env.VERCEL
      ? chromium.args
      : ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  return globalBrowser;
}

/* ---------------------------
   Escape HTML
---------------------------- */
function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ---------------------------
   HTML Builder
---------------------------- */
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
        <td>${
          c.totalMarks
            ? ((c.obtainedMarks / c.totalMarks) * 100).toFixed(1)
            : "0"
        }%</td>
      </tr>`
    )
    .join("");

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body { font-family: Arial; padding: 30px; }
      h1 { text-align: center; margin-bottom: 20px; }
      p { margin: 5px 0; }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
      }

      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: right;
      }

      th {
        background: #111;
        color: #fff;
      }

      .summary {
        margin-top: 20px;
        font-weight: bold;
      }
    </style>
  </head>

  <body>

    <h1>Student Report Card</h1>

    <p><b>Name:</b> ${esc(student.name)}</p>
    <p><b>Roll No:</b> ${esc(student.rollNumber)}</p>
    <p><b>Email:</b> ${esc(student.email || "")}</p>
    <p><b>Class:</b> ${esc(classInfo.className || "")}</p>

    <table>
      <thead>
        <tr>
          <th>Subject</th>
          <th>Total</th>
          <th>Obtained</th>
          <th>%</th>
        </tr>
      </thead>

      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="summary">
      Total: ${totalObtained} / ${totalMax} <br/>
      Percentage: ${percentage.toFixed(2)}%
    </div>

  </body>
  </html>
  `;
}

/* ---------------------------
   MAIN API ROUTE
---------------------------- */
export async function GET(_req: NextRequest, context: RouteContext) {
  let browser: Browser | null = null;
  let page = null;

  try {
    await connectDB();

    // ✅ FIX: params is Promise in Next.js
    const { id } = await context.params;

    validateObjectId(id, "Student");

    const student = await getStudentByIdService(id);
    const studentObj = student.toObject();

    const classInfo = studentObj.classId || {};
    const classId = String(classInfo._id || "");

    const marksDoc = await getMarksByStudentAndClassService(id, classId);

    const courseMarks: CourseMark[] =
      marksDoc?.toObject()?.courseMarks || [];

    const totalObtained = courseMarks.reduce(
      (sum, c) => sum + c.obtainedMarks,
      0
    );

    const totalMax = courseMarks.reduce(
      (sum, c) => sum + c.totalMarks,
      0
    );

    const percentage = totalMax ? (totalObtained / totalMax) * 100 : 0;

    const html = buildHTML(
      studentObj,
      classInfo,
      courseMarks,
      totalObtained,
      totalMax,
      percentage
    );

    browser = await getBrowser();
    page = await browser.newPage();

    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", bottom: "20px" },
    });

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="report-${id}.pdf"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "PDF generation failed",
      },
      { status: 500 }
    );
  } finally {
    if (page) await page.close();
  }
}