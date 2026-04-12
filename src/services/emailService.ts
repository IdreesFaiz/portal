import { sendBulkMail } from "@/lib/mailer";
import { getStudentsByClassService } from "@/services/studentService";

/** Escapes HTML special characters to prevent injection in email bodies. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Base URL for the public result portal link in emails. */
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * Builds a styled HTML email body for the result announcement.
 */
function buildResultEmailHtml(
  studentName: string,
  className: string,
  year: number,
  portalUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ur">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin:0; padding:0; background-color:#f3f4f6; font-family:'Segoe UI',Tahoma,Arial,sans-serif; direction:rtl;">
      <div style="max-width:560px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        
        <div style="background:linear-gradient(135deg,#1e293b,#334155); padding:32px 24px; text-align:center;">
          <h1 style="color:#ffffff; margin:0; font-size:22px; font-weight:700;">
            نتائج کا اعلان
          </h1>
          <p style="color:#94a3b8; margin:8px 0 0; font-size:13px;">
            اسکول مینجمنٹ سسٹم
          </p>
        </div>

        <div style="padding:32px 24px;">
          <p style="color:#1e293b; font-size:16px; margin:0 0 16px;">
            محترم <strong>${studentName}</strong>،
          </p>
          
          <p style="color:#475569; font-size:14px; line-height:1.7; margin:0 0 20px;">
            ہمیں آپ کو یہ بتاتے ہوئے خوشی ہو رہی ہے کہ
            <strong style="color:#4f46e5;">${className} (${year})</strong>
            کے نتائج شائع کر دیے گئے ہیں۔ آپ اب اپنا مکمل رزلٹ کارڈ دیکھ سکتے ہیں
            جس میں مضمون وار نمبرات، فیصد اور پاس/فیل کی حیثیت شامل ہے۔
          </p>

          <div style="text-align:center; margin:28px 0;">
            <a href="${portalUrl}" 
               style="display:inline-block; padding:14px 32px; background:#4f46e5; color:#ffffff; text-decoration:none; border-radius:8px; font-size:14px; font-weight:600;">
              اپنا نتیجہ دیکھیں
            </a>
          </div>

          <p style="color:#64748b; font-size:13px; line-height:1.6; margin:20px 0 0;">
            اگر اوپر والا بٹن کام نہیں کرتا تو یہ لنک اپنے براؤزر میں کاپی کریں:<br/>
            <a href="${portalUrl}" style="color:#4f46e5; word-break:break-all;">${portalUrl}</a>
          </p>
        </div>

        <div style="background:#f8fafc; padding:20px 24px; border-top:1px solid #e2e8f0; text-align:center;">
          <p style="color:#94a3b8; font-size:11px; margin:0;">
            یہ اسکول مینجمنٹ سسٹم کی طرف سے خودکار اطلاع ہے۔<br/>
            براہ کرم اس ای میل کا جواب نہ دیں۔
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Sends result announcement emails to all students enrolled in a class.
 * Called when `resultsPublished` is set to true.
 *
 * Runs asynchronously — caller should fire-and-forget.
 * @returns Count of successfully sent emails.
 */
export async function sendResultAnnouncementEmails(
  classId: string,
  className: string,
  year: number
): Promise<number> {
  const students = await getStudentsByClassService(classId);

  if (students.length === 0) {
    console.log("[email] No students in class — skipping email blast.");
    return 0;
  }

  const portalUrl = getBaseUrl();

  const emails = students.map((student) => {
    const html = buildResultEmailHtml(escapeHtml(student.name), escapeHtml(className), year, portalUrl);
    const text = [
      `محترم ${student.name}،`,
      "",
      `${className} (${year}) کے نتائج شائع کر دیے گئے ہیں۔`,
      `اپنا رزلٹ کارڈ دیکھنے کے لیے طالب علم نتائج پورٹل پر جائیں: ${portalUrl}`,
      "",
      "یہ اسکول مینجمنٹ سسٹم کی طرف سے خودکار اطلاع ہے۔",
    ].join("\n");

    return {
      to: student.email,
      subject: `نتائج شائع ہو گئے — ${className} (${year})`,
      text,
      html,
    };
  });

  console.log(`[email] Sending result emails to ${emails.length} student(s)...`);
  const sent = await sendBulkMail(emails);
  console.log(`[email] ${sent}/${emails.length} emails sent successfully.`);
  return sent;
}
