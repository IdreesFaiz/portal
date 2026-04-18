import ClassModel from "@/models/class";
import StudentModel from "@/models/student";
import MarkModel from "@/models/mark";
import { NotFoundError, ValidationError } from "@/lib/error-message";
import { reconcileCourseMarks, type StoredCourseMark } from "@/lib/marks-reconcile";
import type { Class, Course } from "@/types/class.types";

/**
 * Filters and normalises course entries — removes empty names and zero-mark courses.
 */
function sanitizeCourses(courses: Class["courses"]): Class["courses"] {
  return (courses || [])
    .filter((c) => c.name?.trim() && c.marks > 0)
    .map((c) => ({
      name: c.name.trim(),
      marks: Number(c.marks),
    }));
}

/**
 * Creates a new class with sanitised courses.
 * @throws ValidationError if className or year is empty.
 */
export async function createClassService(data: Class) {
  if (!data.className?.trim()) {
    throw new ValidationError("Class name is required");
  }
  const year = Number(data.year);
  if (!year || Number.isNaN(year)) {
    throw new ValidationError("Year is required and must be a valid number");
  }

  return await ClassModel.create({
    className: data.className.trim(),
    year,
    courses: sanitizeCourses(data.courses),
    resultsPublished: data.resultsPublished ?? false,
  });
}

/**
 * Returns all classes sorted by creation date (newest first).
 */
export async function getClassesService() {
  return await ClassModel.find().sort({ createdAt: -1 });
}

/**
 * Returns a single class by id.
 * @throws NotFoundError if the class does not exist.
 */
export async function getClassByIdService(id: string) {
  const cls = await ClassModel.findById(id);
  if (!cls) {
    throw new NotFoundError("Class not found");
  }
  return cls;
}

/**
 * Rewrites every stored mark record for a class so that the course names and
 * per-course totalMarks stay aligned with the class's current courses.
 *
 * Called whenever class.courses changes; also usable as a lazy repair pass
 * for data that drifted before this reconciliation existed.
 */
export async function syncMarksWithClassCourses(
  classId: string,
  oldCourses: readonly Course[],
  newCourses: readonly Course[]
): Promise<void> {
  const marks = await MarkModel.find({ classId });
  if (marks.length === 0) return;

  const ops = marks.map((mark) => {
    const existing = (mark.courseMarks ?? []) as StoredCourseMark[];
    const reconciled = reconcileCourseMarks(oldCourses, newCourses, existing);
    return {
      updateOne: {
        filter: { _id: mark._id },
        update: { $set: { courseMarks: reconciled } },
      },
    };
  });

  if (ops.length > 0) {
    await MarkModel.bulkWrite(ops);
  }
}

/**
 * Updates a class by id with the provided partial data.
 * Courses are sanitised before saving. When courses change (rename, reorder,
 * add, remove, or max-marks edit) the existing mark records are reconciled so
 * result cards and marks-entry grids stay in sync with the new course list.
 * @throws NotFoundError if the class does not exist.
 */
export async function updateClassService(id: string, data: Partial<Class>) {
  const updateData: Record<string, unknown> = {};

  if (data.className !== undefined) {
    updateData.className = data.className.trim();
  }
  if (data.year !== undefined) {
    const year = Number(data.year);
    if (Number.isNaN(year)) {
      throw new ValidationError("Year must be a valid number");
    }
    updateData.year = year;
  }

  let sanitizedCourses: Course[] | null = null;
  let oldCourses: Course[] = [];
  if (data.courses !== undefined) {
    const existing = await ClassModel.findById(id);
    if (!existing) {
      throw new NotFoundError("Class not found");
    }
    const existingCourses = (existing.courses ?? []) as Course[];
    oldCourses = existingCourses.map((course) => ({
      name: course.name,
      marks: course.marks,
    }));
    sanitizedCourses = sanitizeCourses(data.courses);
    updateData.courses = sanitizedCourses;
  }

  if (data.resultsPublished !== undefined) {
    updateData.resultsPublished = data.resultsPublished;
  }

  const cls = await ClassModel.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!cls) {
    throw new NotFoundError("Class not found");
  }

  if (sanitizedCourses !== null) {
    await syncMarksWithClassCourses(id, oldCourses, sanitizedCourses);
  }

  return cls;
}

/**
 * Deletes a class by id.
 * - Deletes all mark records for this class.
 * - Sets classId to null on all students (moves them to "draft" state).
 *
 * Dependant writes (mark deletion, student detachment) run before the class
 * itself is removed so a partial failure cannot leave orphan marks or
 * students pointing at a missing class.
 * @throws NotFoundError if the class does not exist.
 */
export async function deleteClassService(id: string) {
  const exists = await ClassModel.exists({ _id: id });
  if (!exists) {
    throw new NotFoundError("Class not found");
  }

  await MarkModel.deleteMany({ classId: id });
  await StudentModel.updateMany({ classId: id }, { $set: { classId: null } });

  const cls = await ClassModel.findByIdAndDelete(id);
  if (!cls) {
    throw new NotFoundError("Class not found");
  }
  return cls;
}

/**
 * Promotes all students from one class to another.
 * - Validates both source and target classes exist.
 * - Moves students' classId from source to target.
 * - Marks from the old class remain untouched (historical data).
 * @returns The count of promoted students.
 */
export async function promoteStudentsService(
  sourceClassId: string,
  targetClassId: string
): Promise<{ promotedCount: number }> {
  if (sourceClassId === targetClassId) {
    throw new ValidationError("Source and target class cannot be the same");
  }

  const source = await ClassModel.findById(sourceClassId);
  if (!source) {
    throw new NotFoundError("Source class not found");
  }

  const target = await ClassModel.findById(targetClassId);
  if (!target) {
    throw new NotFoundError("Target class not found");
  }

  const result = await StudentModel.updateMany(
    { classId: sourceClassId },
    { $set: { classId: targetClassId } }
  );

  return { promotedCount: result.modifiedCount };
}
