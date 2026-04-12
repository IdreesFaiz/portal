import { z } from "zod";

/** Reusable ObjectId format validator. */
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId format");

/* ──────────────────────── Auth ──────────────────────── */

export const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

/* ──────────────────────── Class ──────────────────────── */

const courseSchema = z.object({
  name: z.string().min(1, "Course name is required"),
  marks: z.number().int().positive("Marks must be a positive number"),
});

export const createClassSchema = z.object({
  className: z.string().min(1, "Class name is required").transform((v) => v.trim()),
  year: z.number().int().min(2020).max(2050),
  courses: z.array(courseSchema).default([]),
  resultsPublished: z.boolean().default(false),
});

export const updateClassSchema = z.object({
  className: z.string().min(1, "Class name is required").transform((v) => v.trim()),
  year: z.number().int().min(2020).max(2050),
  courses: z.array(courseSchema),
  resultsPublished: z.boolean(),
}).partial();

/** Schema for promoting students from one class to another. */
export const promoteStudentsSchema = z.object({
  targetClassId: objectId,
});

/* ──────────────────────── Student ──────────────────────── */

export const createStudentSchema = z.object({
  registrationNumber: z.string().min(1, "Registration number is required").transform((v) => v.trim()),
  rollNumber: z.string().min(1, "Roll number is required").transform((v) => v.trim()),
  name: z.string().min(1, "Name is required").transform((v) => v.trim()),
  parentName: z.string().min(1, "Parent name is required").transform((v) => v.trim()),
  email: z.string().email("Valid email is required").transform((v) => v.trim()),
  phone: z.string().min(1, "Phone number is required").transform((v) => v.trim()),
  CNIC: z.string().min(1, "CNIC is required").transform((v) => v.trim()),
  classId: z.string().min(1, "Class ID is required"),
});

export const updateStudentSchema = createStudentSchema.partial();

/** Schema for assigning a class to a draft student. */
export const assignClassSchema = z.object({
  classId: objectId,
});

/* ──────────────────────── Marks ──────────────────────── */

const courseMarkSchema = z.object({
  courseName: z.string().min(1),
  totalMarks: z.number().positive(),
  obtainedMarks: z.number().min(0),
});

export const upsertMarkSchema = z.object({
  studentId: objectId,
  classId: objectId,
  courseMarks: z.array(courseMarkSchema).min(1, "At least one course mark is required"),
});

export const bulkUpsertMarksSchema = z.object({
  entries: z.array(upsertMarkSchema).min(1, "At least one entry is required"),
});

/* ──────────────────────── Helpers ──────────────────────── */

/**
 * Safely parses data against a Zod schema.
 * Returns `{ data }` on success or `{ error }` with a human-readable message on failure.
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { data: T; error?: undefined } | { data?: undefined; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { data: result.data };
  }
  const message = result.error.issues.map((i) => i.message).join(", ");
  return { error: message };
}
