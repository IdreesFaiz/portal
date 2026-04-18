import MarkModel from "@/models/mark";
import ClassModel from "@/models/class";
import StudentModel from "@/models/student";
import { NotFoundError, ValidationError } from "@/lib/error-message";
import {
  marksNeedReconciliation,
  reconcileCourseMarks,
  type StoredCourseMark,
} from "@/lib/marks-reconcile";
import type { MarkPayload, CourseMark } from "@/types/mark.types";
import type { Course } from "@/types/class.types";

/**
 * Loads the class's current courses once so repeated mark repairs for the
 * same class don't repeatedly hit the database.
 */
async function loadClassCourses(classId: string): Promise<Course[] | null> {
  const cls = await ClassModel.findById(classId).select("courses").lean();
  if (!cls) return null;
  const courses = (cls as { courses?: Course[] }).courses ?? [];
  return courses.map((c) => ({ name: c.name, marks: c.marks }));
}

/**
 * Lazily self-heals a mark record so its stored courseMarks match the class's
 * current courses. A no-op when no drift is detected. Any write failures are
 * swallowed — stale data will simply be retried on the next read.
 */
async function repairMarkIfDrifted(
  mark: { _id: unknown; courseMarks: StoredCourseMark[] } | null,
  classCourses: Course[]
): Promise<void> {
  if (!mark) return;
  const existing = mark.courseMarks ?? [];
  if (!marksNeedReconciliation(classCourses, existing)) return;

  const inferredOld: Course[] = existing.map((m) => ({
    name: m.courseName,
    marks: m.totalMarks,
  }));
  const reconciled = reconcileCourseMarks(inferredOld, classCourses, existing);
  try {
    await MarkModel.updateOne({ _id: mark._id }, { $set: { courseMarks: reconciled } });
    mark.courseMarks = reconciled;
  } catch {
    // Best-effort repair — the next read will try again.
  }
}

/**
 * Validates that obtainedMarks does not exceed totalMarks for any course.
 * @throws ValidationError if validation fails.
 */
function validateCourseMarks(courseMarks: CourseMark[]): void {
  for (const cm of courseMarks) {
    if (cm.obtainedMarks < 0) {
      throw new ValidationError(`Obtained marks for "${cm.courseName}" cannot be negative`);
    }
    if (cm.totalMarks <= 0) {
      throw new ValidationError(`Total marks for "${cm.courseName}" must be greater than zero`);
    }
    if (cm.obtainedMarks > cm.totalMarks) {
      throw new ValidationError(
        `Obtained marks (${cm.obtainedMarks}) cannot exceed total marks (${cm.totalMarks}) for "${cm.courseName}"`
      );
    }
  }
}

/**
 * Ensures the incoming mark entry targets a real student that actually
 * belongs to the given class, and coerces the payload's course names and
 * per-course totals to match the class's current courses.
 *
 * This prevents two categories of bad writes:
 *  - A client submitting a (studentId, classId) pair where the student
 *    is not enrolled in that class.
 *  - A client submitting `courseMarks` whose names/totals disagree with
 *    the class's current courses (which would immediately drift stored data).
 */
async function alignEntryWithClass(
  entry: MarkPayload,
  classCourses: readonly Course[]
): Promise<CourseMark[]> {
  const student = await StudentModel.findOne({
    _id: entry.studentId,
    classId: entry.classId,
  }).select("_id");
  if (!student) {
    throw new ValidationError(
      `Student ${entry.studentId} is not enrolled in class ${entry.classId}`
    );
  }

  if (classCourses.length === 0) {
    throw new ValidationError("Target class has no courses configured");
  }

  const incoming: StoredCourseMark[] = (entry.courseMarks ?? []).map((cm) => ({
    courseName: cm.courseName,
    totalMarks: cm.totalMarks,
    obtainedMarks: cm.obtainedMarks,
  }));
  return reconcileCourseMarks(classCourses, classCourses, incoming);
}

/**
 * Creates or updates (upserts) marks for a student in a given class.
 * Uses the compound unique index on (studentId, classId) to prevent duplicates.
 * Verifies the student is enrolled in the class and aligns the saved
 * courseMarks with the class's current courses.
 */
export async function upsertMarkService(data: MarkPayload) {
  if (!data.studentId || !data.classId) {
    throw new ValidationError("studentId and classId are required");
  }
  if (!data.courseMarks || data.courseMarks.length === 0) {
    throw new ValidationError("At least one course mark is required");
  }

  validateCourseMarks(data.courseMarks);

  const classCourses = await loadClassCourses(data.classId);
  if (!classCourses) {
    throw new NotFoundError("Class not found");
  }

  const aligned = await alignEntryWithClass(data, classCourses);

  return await MarkModel.findOneAndUpdate(
    { studentId: data.studentId, classId: data.classId },
    { courseMarks: aligned },
    { new: true, upsert: true, runValidators: true }
  );
}

/**
 * Bulk upsert — saves marks for multiple students in a single class.
 * Validates that all entries share the same classId, every student is
 * actually enrolled in that class, and coerces course names/totals to the
 * class's current courses.
 */
export async function bulkUpsertMarksService(entries: MarkPayload[]) {
  if (!entries.length) {
    throw new ValidationError("At least one mark entry is required");
  }

  const classId = entries[0].classId;
  for (const entry of entries) {
    if (entry.classId !== classId) {
      throw new ValidationError("All entries must belong to the same class");
    }
    if (entry.courseMarks && entry.courseMarks.length > 0) {
      validateCourseMarks(entry.courseMarks);
    }
  }

  const classCourses = await loadClassCourses(classId);
  if (!classCourses) {
    throw new NotFoundError("Class not found");
  }
  if (classCourses.length === 0) {
    throw new ValidationError("Target class has no courses configured");
  }

  const studentIds = entries.map((entry) => entry.studentId);
  const enrolled = await StudentModel.find({
    _id: { $in: studentIds },
    classId,
  })
    .select("_id")
    .lean();
  const enrolledSet = new Set(enrolled.map((doc) => String(doc._id)));
  for (const entry of entries) {
    if (!enrolledSet.has(String(entry.studentId))) {
      throw new ValidationError(`Student ${entry.studentId} is not enrolled in the target class`);
    }
  }

  const ops = entries.map((entry) => {
    const incoming: StoredCourseMark[] = (entry.courseMarks ?? []).map((cm) => ({
      courseName: cm.courseName,
      totalMarks: cm.totalMarks,
      obtainedMarks: cm.obtainedMarks,
    }));
    const aligned = reconcileCourseMarks(classCourses, classCourses, incoming);
    return {
      updateOne: {
        filter: { studentId: entry.studentId, classId: entry.classId },
        update: { $set: { courseMarks: aligned } },
        upsert: true,
      },
    };
  });

  await MarkModel.bulkWrite(ops);

  return await MarkModel.find({ classId })
    .populate("studentId", "name rollNumber")
    .populate("classId", "className");
}

/**
 * Returns marks for a specific student in a specific class.
 * Auto-repairs stale course names / totals if the class has drifted.
 */
export async function getMarksByStudentAndClassService(studentId: string, classId: string) {
  const mark = await MarkModel.findOne({ studentId, classId });
  if (!mark) return mark;

  const classCourses = await loadClassCourses(classId);
  if (classCourses) {
    await repairMarkIfDrifted(
      mark as unknown as { _id: unknown; courseMarks: StoredCourseMark[] },
      classCourses
    );
  }
  return mark;
}

/**
 * Returns all mark records for a specific student across all classes.
 */
export async function getMarksByStudentService(studentId: string) {
  return await MarkModel.find({ studentId }).populate("classId", "className");
}

/**
 * Returns all mark records for students in a specific class.
 * Populates student name/roll and class name for display.
 * Auto-repairs drifted course names / totals for the entire class in one pass.
 */
export async function getMarksByClassService(classId: string) {
  const classCourses = await loadClassCourses(classId);

  if (classCourses && classCourses.length > 0) {
    const rawMarks = await MarkModel.find({ classId });
    const toRepair = rawMarks.filter((mark) =>
      marksNeedReconciliation(classCourses, (mark.courseMarks ?? []) as StoredCourseMark[])
    );

    if (toRepair.length > 0) {
      const ops = toRepair.map((mark) => {
        const existing = (mark.courseMarks ?? []) as StoredCourseMark[];
        const inferredOld: Course[] = existing.map((m) => ({
          name: m.courseName,
          marks: m.totalMarks,
        }));
        const reconciled = reconcileCourseMarks(inferredOld, classCourses, existing);
        return {
          updateOne: {
            filter: { _id: mark._id },
            update: { $set: { courseMarks: reconciled } },
          },
        };
      });
      try {
        await MarkModel.bulkWrite(ops);
      } catch {
        // Best-effort — read path continues with the latest documents below.
      }
    }
  }

  return await MarkModel.find({ classId })
    .populate("studentId", "name rollNumber")
    .populate("classId", "className");
}

/**
 * Deletes a mark record by its id.
 * @throws NotFoundError if the mark record does not exist.
 */
export async function deleteMarkService(id: string) {
  const mark = await MarkModel.findByIdAndDelete(id);
  if (!mark) {
    throw new NotFoundError("Mark record not found");
  }
  return mark;
}
