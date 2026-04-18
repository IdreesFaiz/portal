import type { CourseMark } from "@/types/mark.types";

export const PASS_PERCENT = 50;

function safePercent(obtained: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return (obtained / total) * 100;
}

/**
 * Evaluates a student's final result from the stored mark record.
 *
 * The stored `courseMarks` (not the class's current courses) are the
 * source of truth for totals and pass/fail. This prevents inconsistencies
 * when an admin later renames, adds, or removes courses on the class: the
 * previously recorded marks continue to produce the correct totals and
 * badges for that student.
 *
 * Per-subject rule: a subject is considered passed when obtained >= 50% of its totalMarks.
 * Final pass requires every recorded subject to pass. An empty marks array
 * is treated as "not evaluated" and returns `passed = false`.
 */
export function evaluateFinalResult(courseMarks: readonly CourseMark[]): {
  totalObtained: number;
  totalMax: number;
  percentage: number;
  passed: boolean;
} {
  let totalObtained = 0;
  let totalMax = 0;
  let allSubjectsPassed = courseMarks.length > 0;

  for (const cm of courseMarks) {
    const obtained = Number.isFinite(cm.obtainedMarks) ? cm.obtainedMarks : 0;
    const total = Number.isFinite(cm.totalMarks) ? cm.totalMarks : 0;
    totalObtained += obtained;
    totalMax += total;

    if (safePercent(obtained, total) < PASS_PERCENT) {
      allSubjectsPassed = false;
    }
  }

  return {
    totalObtained,
    totalMax,
    percentage: safePercent(totalObtained, totalMax),
    passed: allSubjectsPassed,
  };
}
