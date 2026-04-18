import MarkModel from "@/models/mark";
import { NotFoundError, ValidationError } from "@/lib/error-message";
import type { MarkPayload, CourseMark } from "@/types/mark.types";

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
 * Creates or updates (upserts) marks for a student in a given class.
 * Uses the compound unique index on (studentId, classId) to prevent duplicates.
 */
export async function upsertMarkService(data: MarkPayload) {
  if (!data.studentId || !data.classId) {
    throw new ValidationError("studentId and classId are required");
  }
  if (!data.courseMarks || data.courseMarks.length === 0) {
    throw new ValidationError("At least one course mark is required");
  }

  validateCourseMarks(data.courseMarks);

  return await MarkModel.findOneAndUpdate(
    { studentId: data.studentId, classId: data.classId },
    { courseMarks: data.courseMarks },
    { new: true, upsert: true, runValidators: true }
  );
}

/**
 * Bulk upsert — saves marks for multiple students in a single class.
 * Validates that all entries share the same classId to prevent cross-class writes.
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

  const ops = entries.map((entry) => ({
    updateOne: {
      filter: { studentId: entry.studentId, classId: entry.classId },
      update: { $set: { courseMarks: entry.courseMarks } },
      upsert: true,
    },
  }));

  await MarkModel.bulkWrite(ops);

  return await MarkModel.find({ classId })
    .populate("studentId", "name rollNumber")
    .populate("classId", "className");
}

/**
 * Returns marks for a specific student in a specific class.
 */
export async function getMarksByStudentAndClassService(studentId: string, classId: string) {
  return await MarkModel.findOne({ studentId, classId });
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
 */
export async function getMarksByClassService(classId: string) {
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
