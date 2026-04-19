import { NextRequest, NextResponse } from "next/server";
import puppeteer, { type Browser, type Page } from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { connectDB } from "@/lib/db";
import { errorMessage, errorStatusCode } from "@/lib/error-message";
import { validateObjectId } from "@/lib/validate-id";
import { evaluateFinalResult, computeGradeLabel } from "@/lib/result-status";
import { getStudentByIdService } from "@/services/studentService";
import { getMarksByStudentAndClassService } from "@/services/markService";
import type { CourseMark } from "@/types/mark.types";
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

  try {
    const sparticuzPath = await chromium.executablePath();
    if (sparticuzPath) {
      candidates.push({ executablePath: sparticuzPath, useChromiumFlags: true });
    }
  } catch {
    // If sparticuz can't resolve an executable (e.g. local dev without the
    // bundled binary), we'll rely on the other candidates above.
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
  const studentName = esc(String(student.name ?? "-"));
  const parentName = esc(String(student.parentName ?? "-"));
  const rollNumber = esc(String(student.rollNumber ?? "-"));
  const registrationNumber = esc(String(student.registrationNumber ?? "-"));
  const cnic = esc(String(student.CNIC ?? "-"));
  const phone = esc(String(student.phone ?? "-"));
  const className = esc(String(classInfo.className ?? "-"));
  const classYear = esc(String(classInfo.year ?? new Date().getFullYear()));

  // Uniform light-dotted gray border for every cell. We use
  // `border-separate` + `border-spacing: 0` on the parent <table> so Chromium
  // actually renders the dotted pattern in the PDF — `border-collapse` would
  // flatten dotted/dashed styles to solid lines.
  //
  // `leading-7` is critical for Urdu Nastaliq script: its glyphs have tall
  // ascenders + deep descenders that touch / clip cell borders with the
  // default `leading-normal` (1.5). Combined with `py-2.5`, this gives Urdu
  // text room to breathe and avoids top/bottom overlap.
  const cellBase = "border border-dotted border-gray-400 px-3 py-2.5 align-middle leading-7";
  const tableBase =
    'class="w-full text-[14px] mb-6" style="border-spacing:0; border-collapse:separate;"';

  // Renders a "Label: Value" pair using flex-wrap so the colon stays attached
  // to the label and long values wrap to a new line cleanly without
  // overlapping the label glyph (a common Urdu-Nastaliq rendering issue).
  // `word-break: break-word` is inlined as plain CSS instead of a Tailwind
  // utility because the PDF runs Tailwind via the v3 Play CDN.
  const infoLine = (label: string, value: string) =>
    `<div class="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 leading-7">
      <span class="font-extrabold shrink-0">${esc(label)}:</span>
      <span class="min-w-0" style="word-break: break-word;">${value}</span>
    </div>`;

  const courseRows = courseMarks
    .map((cm, idx) => {
      const serial = String(idx + 1).padStart(2, "0");
      const subjectPct = cm.totalMarks > 0 ? (cm.obtainedMarks / cm.totalMarks) * 100 : 0;
      const subjectStatus = subjectPct >= 50 ? "پاس" : "فیل";
      return `
      <tr>
        <td class="${cellBase} text-center w-16">${serial}</td>
        <td class="${cellBase}">${esc(cm.courseName)}</td>
        <td class="${cellBase} text-center w-24">${cm.totalMarks}</td>
        <td class="${cellBase} text-center w-32">${cm.obtainedMarks}</td>
        <td class="${cellBase} text-center w-24">${subjectStatus}</td>
      </tr>`;
    })
    .join("");

  const resultLabel = passed ? "کامیاب" : "ناکام";
  const gradeLabel = computeGradeLabel(percentage, passed);

  const printTimestamp = new Date().toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return `<!DOCTYPE html>
<html dir="rtl" lang="ur">
<head>
  <meta charset="UTF-8" />
  <script src="https://cdn.tailwindcss.com"></script>
  <!--
    Vercel/serverless Chromium (@sparticuz/chromium) ships WITHOUT any Urdu
    fonts, so Nastaliq glyphs render as empty rectangles or fall back to a
    Latin font. Loading Noto Nastaliq Urdu + Noto Naskh Arabic from Google
    Fonts CDN is the simplest reliable fix — Chromium fetches them at
    runtime and \`networkidle0\` + \`document.fonts.ready\` ensure they're
    rendered before we capture the PDF. Local dev still uses installed
    system fonts via the family fallback chain.
  -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap"
  />
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    /* Global Urdu-friendly line-height + safer baseline so Nastaliq
       descenders don't clip against borders or the next line. */
    body {
      font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Noto Naskh Arabic', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.7;
      /* Nastaliq is visually busier than Naskh; nudge body size up a touch
         so it stays legible at A4 print scale. */
      font-size: 14px;
    }
    h1, h2, h3 { line-height: 1.5; }
    /* Numerals look cleaner in Naskh — Nastaliq digits can feel cramped
       inside table cells. Apply Naskh only to plain digit cells. */
    .num { font-family: 'Noto Naskh Arabic', 'Segoe UI', Tahoma, sans-serif; }
  </style>
</head>
<body class="bg-white text-black" style="direction: rtl;">

  <!-- Header -->
  <div class="flex items-center gap-4 pb-4 border-b border-dotted border-gray-400 mb-6">
    <div class="shrink-0 w-24 h-24 rounded-full border-2 border-gray-500 flex flex-col items-center justify-center text-center leading-snug px-2 gap-0.5">
      <div class="text-[12px] font-extrabold">شعبہ</div>
      <div class="text-[12px] font-extrabold">امتحانات</div>
    </div>
    <div class="flex-1 min-w-0 text-center">
      <div class="text-[15px] font-extrabold mb-2 leading-snug">شعبہ امتحانات</div>
      <h1 class="text-[24px] font-extrabold mb-2 leading-snug">نتیجہ کارڈ سالانہ امتحان ${classYear}</h1>
      <h2 class="text-[18px] font-extrabold leading-snug">${className}</h2>
    </div>
    <div class="shrink-0 w-24"></div>
  </div>

  <!-- Student info -->
  <table ${tableBase}>
    <tbody>
      <tr>
        <td class="${cellBase} align-top w-1/3">${infoLine("نام امیدوار", studentName)}</td>
        <td class="${cellBase} align-top w-1/3">${infoLine("ولدیت", parentName)}</td>
        <td class="${cellBase} align-top w-1/3">${infoLine("رول نمبر", rollNumber)}</td>
      </tr>
      <tr>
        <td class="${cellBase} align-top">${infoLine("شناختی کارڈ", cnic)}</td>
        <td class="${cellBase} align-top">${infoLine("فون نمبر", phone)}</td>
        <td class="${cellBase} align-top">${infoLine("رجسٹریشن", registrationNumber)}</td>
      </tr>
      <tr>
        <td class="${cellBase} align-top" colspan="3">${infoLine("نام ادارہ", `${className} - سال ${classYear}`)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Results -->
  <table ${tableBase}>
    <thead>
      <tr class="bg-gray-50">
        <th class="${cellBase} text-center font-extrabold">نمبر شمار</th>
        <th class="${cellBase} text-center font-extrabold">مضامین</th>
        <th class="${cellBase} text-center font-extrabold">کل نمبر</th>
        <th class="${cellBase} text-center font-extrabold">حاصل کردہ نمبر</th>
        <th class="${cellBase} text-center font-extrabold">کیفیت</th>
      </tr>
    </thead>
    <tbody>
      ${courseRows}

      <!-- Total Row -->
      <tr class="bg-gray-50">
        <td class="${cellBase} text-center font-extrabold" colspan="2">میزان</td>
        <td class="${cellBase} text-center font-extrabold">${totalMax}</td>
        <td class="${cellBase} text-center font-extrabold">${totalObtained}</td>
        <td class="${cellBase}"></td>
      </tr>

      <!-- Result aligned under obtained -->
      <tr>
        <td class="${cellBase} text-center font-extrabold" colspan="3">نتیجہ</td>
        <td class="${cellBase} text-center font-extrabold">${resultLabel}</td>
        <td class="${cellBase}"></td>
      </tr>

      <tr>
        <td class="${cellBase} text-center font-extrabold" colspan="3">نتیجہ فیصد</td>
        <td class="${cellBase} text-center font-extrabold">${percentage.toFixed(0)}%</td>
        <td class="${cellBase}"></td>
      </tr>

      <tr>
        <td class="${cellBase} text-center font-extrabold" colspan="3">درجہ / گریڈ</td>
        <td class="${cellBase} text-center font-extrabold">${gradeLabel}</td>
        <td class="${cellBase}"></td>
      </tr>
    </tbody>
  </table>

  <!-- Footer -->
  <div class="text-[12px] pt-4 border-t border-dotted border-gray-400 mb-6 font-medium" style="line-height: 1.9;">
    <p>نوٹ: یہ نتیجہ کارڈ کا الیکٹرانک ورژن ہے، سہو کتابت اور غلطی کا احتمال موجود ہے۔ تفصیلات کے لیے شعبہ امتحانات سے رابطہ کریں۔</p>
  </div>

  <!-- Bottom -->
  <div class="flex justify-between items-end text-[13px] mt-10" style="line-height: 1.7;">
    <div>
      <p class="font-semibold">پرنٹ کرنے کی تاریخ: ${printTimestamp}</p>
    </div>
    <div class="text-center">
      <div class="border-t border-dotted border-gray-500 pt-3 px-8 font-extrabold">کنٹرولر امتحانات</div>
    </div>
  </div>

</body>
</html>`;
}

/** GET /api/student/:id/report — generates a PDF report card for the student. */
export async function GET(_req: NextRequest, context: RouteContext) {
  let page: Page | null = null;

  try {
    const { id } = await context.params;
    validateObjectId(id, "Student");

    // Launching Chromium (1-3s cold start) does NOT depend on any DB data, so
    // we kick it off in parallel with `connectDB()` + student/marks fetches.
    // On warm lambdas this is essentially free; on cold starts we save the
    // Chromium launch time by overlapping it with MongoDB work.
    const browserPromise = getReusableBrowser(process.env.CHROME_PATH);
    // If the browser promise rejects before we await it (e.g. binary missing),
    // Node would otherwise log an "unhandled rejection" warning. Attach a
    // no-op catch here; the real error surfaces when we `await` below.
    browserPromise.catch(() => undefined);

    await connectDB();

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
    const { totalObtained, totalMax, percentage, passed } = evaluateFinalResult(courseMarks);

    const html = buildReportHTML(
      studentObj,
      classInfo,
      courseMarks,
      totalObtained,
      totalMax,
      percentage,
      passed
    );

    const browser = await browserPromise;
    page = await browser.newPage();
    // A4 portrait at 96 DPI: 794 × 1123 px. Matching the viewport to the
    // target paper size prevents layout shifts between on-screen rendering
    // and the final PDF.
    await page.setViewport({ width: 794, height: 1123 });
    // Tailwind CDN (`cdn.tailwindcss.com`) loads via an external script and
    // JIT-compiles utility classes in-browser. If we used `domcontentloaded`
    // Puppeteer would capture the PDF before Tailwind finishes, producing an
    // unstyled document. `networkidle0` waits until the network is quiet,
    // which gives the CDN time to fetch + compile before rendering.
    await page.setContent(html, { waitUntil: "networkidle0" });

    // `networkidle0` doesn't guarantee that webfonts (Noto Nastaliq Urdu /
    // Noto Naskh Arabic from Google Fonts) have finished registering with
    // the FontFaceSet. Without this wait, the first PDF on a cold lambda
    // sometimes captures Urdu text rendered with a Latin fallback before
    // the real font swaps in. `document.fonts.ready` resolves only once
    // every declared @font-face is loaded and ready to render.
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="report-${String(studentObj.rollNumber ?? id)}.pdf"`,
        // No CDN caching: the PDF must reflect the admin's latest edits
        // (marks, course names, student info) in real time. We rely on
        // parallel browser launch + MongoDB fetches to keep latency low
        // (~1-3s warm, ~2-4s cold) instead of serving stale cached copies.
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
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
