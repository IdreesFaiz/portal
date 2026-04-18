import type { Course } from "@/types/class.types";

export interface StoredCourseMark {
  courseName: string;
  totalMarks: number;
  obtainedMarks: number;
}

/**
 * Reconciles a student's stored courseMarks against the class's current courses.
 *
 * Class courses are stored as `{ name, marks }` without stable identifiers, so
 * when an admin renames, reorders, adds, or removes a course the stored marks
 * become out of sync (displayed subject names go stale and grid lookups miss).
 *
 * Strategy:
 *  - Prefer positional mapping when the array length is unchanged. This
 *    cleanly handles pure renames/reorders without losing the obtained marks.
 *  - Otherwise fall back to exact name match (handles add/remove without
 *    touching the surviving courses).
 *  - Always rewrite `courseName` and `totalMarks` from the new class courses so
 *    downstream code (tables, PDFs, totals) stays consistent.
 *  - Clamp `obtainedMarks` to the new `totalMarks` to guard against shrinking maxes.
 */
export function reconcileCourseMarks(
  oldCourses: readonly Course[],
  newCourses: readonly Course[],
  existing: readonly StoredCourseMark[]
): StoredCourseMark[] {
  const sameLength = oldCourses.length === newCourses.length && oldCourses.length > 0;
  const existingByName = new Map<string, StoredCourseMark>(
    existing.map((mark) => [mark.courseName, mark])
  );

  return newCourses.map((newCourse, idx) => {
    let obtained = 0;

    if (sameLength) {
      const oldCourse = oldCourses[idx];
      const carried = existingByName.get(oldCourse.name);
      if (carried) {
        obtained = Math.min(Math.max(0, carried.obtainedMarks), newCourse.marks);
      }
    } else {
      const byName = existingByName.get(newCourse.name);
      if (byName) {
        obtained = Math.min(Math.max(0, byName.obtainedMarks), newCourse.marks);
      }
    }

    return {
      courseName: newCourse.name,
      totalMarks: newCourse.marks,
      obtainedMarks: obtained,
    };
  });
}

/**
 * Returns true when stored marks need to be rewritten to match the class's
 * current courses. Checks length, positional name, and per-course totalMarks.
 */
export function marksNeedReconciliation(
  classCourses: readonly Course[],
  stored: readonly StoredCourseMark[]
): boolean {
  if (classCourses.length !== stored.length) return true;
  for (let i = 0; i < classCourses.length; i += 1) {
    if (classCourses[i].name !== stored[i].courseName) return true;
    if (classCourses[i].marks !== stored[i].totalMarks) return true;
  }
  return false;
}
