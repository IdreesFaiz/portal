import { NextRequest, NextResponse } from "next/server";
import { getBrowser } from "@/lib/browser";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  let page = null;

  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    const html = `
      <html>
        <body>
          <h1>PDF Working on Vercel 🚀</h1>
        </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=test.pdf",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("PDF ERROR:", error);

    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  } finally {
    if (page) await page.close();
  }
}