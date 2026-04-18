import type { Course } from "@/types/class.types";
import type { CourseMark } from "@/types/mark.types";

export const PASS_PERCENT = 50;

function safePercent(obtained: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return (obtained / total) * 100;
}

/**
 * A student is considered final-pass only when every subject is passed.
 * Missing subjects are treated as failed by assigning 0 obtained marks.
 */
export function evaluateFinalResult(
  courses: Course[],
  marksByCourseName: ReadonlyMap<string, CourseMark>
): {
  totalObtained: number;
  totalMax: number;
  percentage: number;
  passed: boolean;
} {
  let totalObtained = 0;
  let totalMax = 0;
  let allSubjectsPassed = courses.length > 0;

  for (const course of courses) {
    const obtained = marksByCourseName.get(course.name)?.obtainedMarks ?? 0;
    totalObtained += obtained;
    totalMax += course.marks;

    if (safePercent(obtained, course.marks) < PASS_PERCENT) {
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
