import ClassModel from "@/models/class";
import StudentModel from "@/models/student";
import MarkModel from "@/models/mark";
import { NotFoundError, ValidationError } from "@/lib/error-message";
import type { Class } from "@/types/class.types";

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
 * Updates a class by id with the provided partial data.
 * Courses are sanitised before saving.
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
  if (data.courses !== undefined) {
    updateData.courses = sanitizeCourses(data.courses);
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
  return cls;
}

/**
 * Deletes a class by id.
 * - Deletes all mark records for this class.
 * - Sets classId to null on all students (moves them to "draft" state).
 * @throws NotFoundError if the class does not exist.
 */
export async function deleteClassService(id: string) {
  const cls = await ClassModel.findByIdAndDelete(id);
  if (!cls) {
    throw new NotFoundError("Class not found");
  }

  await MarkModel.deleteMany({ classId: id });
  await StudentModel.updateMany({ classId: id }, { $set: { classId: null } });

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
