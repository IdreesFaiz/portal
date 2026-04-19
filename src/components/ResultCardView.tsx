import { AlertCircle } from "lucide-react";
import { evaluateFinalResult, computeGradeLabel } from "@/lib/result-status";
import type { CourseMark } from "@/types/mark.types";

/** Subset of student fields rendered on the card. Kept minimal so the
 *  component works for both public lookup results and admin-side modals. */
export interface ResultCardStudent {
  name: string;
  parentName: string;
  rollNumber: string;
  registrationNumber: string;
  CNIC: string;
  phone: string;
}

/** Subset of class fields needed to render the card header / institute row. */
export interface ResultCardClass {
  className: string;
  year: number | string;
}

interface ResultCardViewProps {
  /** Student whose card is being rendered. */
  student: ResultCardStudent;
  /** Populated class info. May be null if the student is not assigned. */
  classInfo: ResultCardClass | null;
  /** Stored per-course marks for this student in the given class. */
  courseMarks: CourseMark[];
}

/**
 * Visual representation of a student's annual result card. The layout mirrors
 * the printable PDF (`/api/student/:id/report`) so the on-screen view and the
 * downloadable copy stay in sync — change the layout here and both the public
 * portal page (`/`) and the admin result modal (`ResultCardModal`) update at
 * once.
 *
 * Pass/fail color highlights are intentionally web-only: the PDF route renders
 * a plain black-and-white version of this same structure.
 */
export default function ResultCardView({ student, classInfo, courseMarks }: ResultCardViewProps) {
  const className = classInfo?.className ?? "—";
  const classYear = classInfo?.year ? String(classInfo.year) : "—";
  const hasMarks = courseMarks.length > 0;
  const { totalMax, totalObtained, percentage, passed } = evaluateFinalResult(courseMarks);
  const resultLabel = passed ? "کامیاب" : "ناکام";
  const gradeLabel = computeGradeLabel(percentage, passed);
  const passColorCell = passed ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50";
  // Uniform light-dotted gray border applied to every table cell.
  // `border-separate` + `border-spacing-0` is required so Chromium actually
  // renders the dotted style — `border-collapse` flattens dotted to solid
  // when generating PDFs.
  //
  // `leading-7` (line-height: 1.75rem) is critical for Urdu Nastaliq script:
  // its glyphs have tall ascenders + deep descenders that touch / clip cell
  // borders with the default `leading-normal` (1.5). The extra `py-2.5`
  // gives matrices/numbers a balanced vertical rhythm too.
  const cellBase = "border border-dotted border-gray-400 px-3 py-2.5 align-middle leading-7";

  return (
    <div className="bg-white text-black" style={{ direction: "rtl", lineHeight: 1.7 }}>
      <div className="flex items-center gap-3 sm:gap-4 pb-4 border-b border-dotted border-gray-400 mb-6">
        <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-gray-500 flex flex-col items-center justify-center text-center leading-snug px-2 gap-0.5">
          <div className="text-[11px] sm:text-[12px] font-extrabold">شعبہ</div>
          <div className="text-[11px] sm:text-[12px] font-extrabold">امتحانات</div>
        </div>
        <div className="flex-1 min-w-0 text-center">
          <div className="text-[12px] sm:text-[15px] font-extrabold mb-2 leading-snug">
            شعبہ امتحانات
          </div>
          <h2 className="text-[16px] sm:text-[22px] font-extrabold mb-2 leading-snug">
            نتیجہ کارڈ سالانہ امتحان {classYear}
          </h2>
          <h3 className="text-[14px] sm:text-[16px] font-extrabold leading-snug">{className}</h3>
        </div>
        {hasMarks ? (
          <div
            className={`shrink-0 w-20 sm:w-24 rounded-xl text-center py-2.5 sm:py-3 border-2 ${
              passed
                ? "bg-green-50 border-green-500 text-green-700"
                : "bg-red-50 border-red-500 text-red-700"
            }`}
          >
            <p className="text-base sm:text-xl font-extrabold leading-snug">
              {passed ? "پاس" : "فیل"}
            </p>
            <p className="text-[10px] sm:text-xs font-bold mt-1 leading-snug opacity-80">
              {percentage.toFixed(1)}%
            </p>
          </div>
        ) : (
          <div className="shrink-0 w-20 sm:w-24" />
        )}
      </div>

      <div className="overflow-x-auto mb-6">
        <table
          className="w-full border-separate text-[13px] sm:text-[14px]"
          style={{ borderSpacing: 0 }}
        >
          <tbody>
            <tr>
              <td className={`${cellBase} align-top w-1/3`}>
                <InfoLine label="نام امیدوار" value={student.name} />
              </td>
              <td className={`${cellBase} align-top w-1/3`}>
                <InfoLine label="ولدیت" value={student.parentName} />
              </td>
              <td className={`${cellBase} align-top w-1/3`}>
                <InfoLine label="رول نمبر" value={student.rollNumber} />
              </td>
            </tr>
            <tr>
              <td className={`${cellBase} align-top`}>
                <InfoLine label="شناختی کارڈ" value={student.CNIC} />
              </td>
              <td className={`${cellBase} align-top`}>
                <InfoLine label="فون نمبر" value={student.phone} />
              </td>
              <td className={`${cellBase} align-top`}>
                <InfoLine label="رجسٹریشن" value={student.registrationNumber} />
              </td>
            </tr>
            <tr>
              <td className={`${cellBase} align-top`} colSpan={3}>
                <InfoLine label="نام ادارہ" value={`${className} - سال ${classYear}`} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {hasMarks ? (
        <div className="overflow-x-auto mb-6">
          <table
            className="w-full border-separate text-[13px] sm:text-[14px]"
            style={{ borderSpacing: 0 }}
          >
            <thead>
              <tr className="bg-gray-50">
                <th className={`${cellBase} text-center font-extrabold`}>نمبر شمار</th>
                <th className={`${cellBase} text-center font-extrabold`}>مضامین</th>
                <th className={`${cellBase} text-center font-extrabold`}>کل نمبر</th>
                <th className={`${cellBase} text-center font-extrabold`}>حاصل کردہ نمبر</th>
                <th className={`${cellBase} text-center font-extrabold`}>کیفیت</th>
              </tr>
            </thead>
            <tbody>
              {courseMarks.map((cm, idx) => {
                const subjectPct = cm.totalMarks > 0 ? (cm.obtainedMarks / cm.totalMarks) * 100 : 0;
                const subjectPassed = subjectPct >= 50;
                const subjectStatus = subjectPassed ? "پاس" : "فیل";
                const serial = String(idx + 1).padStart(2, "0");
                return (
                  <tr key={cm.courseName}>
                    <td className={`${cellBase} text-center w-16`}>{serial}</td>
                    <td className={cellBase}>{cm.courseName}</td>
                    <td className={`${cellBase} text-center w-24`}>{cm.totalMarks}</td>
                    <td className={`${cellBase} text-center w-32`}>{cm.obtainedMarks}</td>
                    <td
                      className={`${cellBase} text-center w-24 font-bold ${
                        subjectPassed ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {subjectStatus}
                    </td>
                  </tr>
                );
              })}

              <tr className="bg-gray-50">
                <td className={`${cellBase} text-center font-extrabold`} colSpan={2}>
                  میزان
                </td>
                <td className={`${cellBase} text-center font-extrabold`}>{totalMax}</td>
                <td className={`${cellBase} text-center font-extrabold`}>{totalObtained}</td>
                <td className={cellBase} />
              </tr>

              <tr>
                <td className={`${cellBase} text-center font-extrabold`} colSpan={3}>
                  نتیجہ
                </td>
                <td className={`${cellBase} text-center font-extrabold ${passColorCell}`}>
                  {resultLabel}
                </td>
                <td className={cellBase} />
              </tr>

              <tr>
                <td className={`${cellBase} text-center font-extrabold`} colSpan={3}>
                  نتیجہ فیصد
                </td>
                <td className={`${cellBase} text-center font-extrabold`}>
                  {percentage.toFixed(0)}%
                </td>
                <td className={cellBase} />
              </tr>

              <tr>
                <td className={`${cellBase} text-center font-extrabold`} colSpan={3}>
                  درجہ / گریڈ
                </td>
                <td className={`${cellBase} text-center font-extrabold ${passColorCell}`}>
                  {gradeLabel}
                </td>
                <td className={cellBase} />
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-6 text-center mb-6">
          <AlertCircle className="w-10 h-10 mx-auto text-yellow-400 mb-2" />
          <p className="text-yellow-700 font-medium leading-relaxed">ابھی نمبرات درج نہیں ہوئے</p>
          <p className="text-yellow-600 text-xs mt-1 leading-relaxed">
            ابھی نمبرات اپ لوڈ نہیں ہوئے۔ بعد میں دوبارہ چیک کریں۔
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Renders a "Label: Value" pair inside an info cell. Using `inline-flex` with
 * `flex-wrap` keeps the colon attached to the label and lets long values flow
 * to the next line without overlapping the label — a common issue with raw
 * `<span> </span>` text when Urdu Nastaliq glyphs collide on wrap.
 */
function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 leading-7">
      <span className="font-extrabold shrink-0">{label}:</span>
      <span className="wrap-break-word min-w-0">{value}</span>
    </div>
  );
}
