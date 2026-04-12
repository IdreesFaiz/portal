import StudentModel from "@/models/student";
import MarkModel from "@/models/mark";
import { NotFoundError, ValidationError } from "@/lib/error-message";
import type { Student } from "@/types/student.types";

/** Required fields validated before creating a student. */
const REQUIRED_FIELDS: ReadonlyArray<keyof Student> = [
  "name",
  "parentName",
  "email",
  "phone",
  "registrationNumber",
  "rollNumber",
  "CNIC",
  "classId",
];

/**
 * Validates that every required field is present and non-empty after trimming.
 * @throws ValidationError if any required field is missing or blank.
 */
function validateStudent(data: Student): void {
  for (const field of REQUIRED_FIELDS) {
    const val = data[field];
    if (!val || (typeof val === "string" && val.trim().length === 0)) {
      throw new ValidationError(`Field "${field}" is required`);
    }
  }
}

/** Trims all string fields on a student record. */
function trimStudentFields(data: Student): Student {
  const trimmed = { ...data };
  for (const key of Object.keys(trimmed) as Array<keyof Student>) {
    const val = trimmed[key];
    if (typeof val === "string") {
      (trimmed[key] as string) = val.trim();
    }
  }
  return trimmed;
}

/**
 * Creates a new student document after validation and trimming.
 */
export async function createStudentService(data: Student) {
  const cleaned = trimStudentFields(data);
  validateStudent(cleaned);
  return await StudentModel.create(cleaned);
}

/**
 * Returns all non-draft students (those with an assigned class),
 * sorted by creation date (newest first).
 * Populates the classId reference so the class name is available.
 */
export async function getStudentsService() {
  return await StudentModel.find({ classId: { $ne: null } })
    .populate("classId", "className courses year resultsPublished")
    .sort({ createdAt: -1 });
}

/**
 * Returns all "draft" students — students with classId = null.
 * These need to be assigned to a new class by the admin.
 */
export async function getDraftStudentsService() {
  return await StudentModel.find({ classId: null }).sort({ createdAt: -1 });
}

/**
 * Returns a single student by id, with class info populated.
 * @throws NotFoundError if the student does not exist.
 */
export async function getStudentByIdService(id: string) {
  const student = await StudentModel.findById(id).populate(
    "classId",
    "className courses year resultsPublished"
  );
  if (!student) {
    throw new NotFoundError("Student not found");
  }
  return student;
}

/**
 * Returns all students belonging to a specific class.
 */
export async function getStudentsByClassService(classId: string) {
  return await StudentModel.find({ classId })
    .populate("classId", "className courses year resultsPublished")
    .sort({ createdAt: -1 });
}

/**
 * Updates a student by id with the provided partial data.
 * @throws NotFoundError if the student does not exist.
 */
export async function updateStudentService(
  id: string,
  data: Partial<Student>
) {
  const student = await StudentModel.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).populate("classId", "className courses year resultsPublished");

  if (!student) {
    throw new NotFoundError("Student not found");
  }
  return student;
}

/**
 * Deletes a student by id and all their mark records.
 * @throws NotFoundError if the student does not exist.
 */
export async function deleteStudentService(id: string) {
  const student = await StudentModel.findByIdAndDelete(id);
  if (!student) {
    throw new NotFoundError("Student not found");
  }
  await MarkModel.deleteMany({ studentId: id });
  return student;
}
