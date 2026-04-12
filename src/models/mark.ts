import mongoose, { Schema, Document } from "mongoose";

/**
 * Mongoose document interface for a Mark record.
 * Uses ObjectId types for Mongo references rather than string-based MarkPayload.
 */
export interface MarkDocument extends Document {
  studentId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  courseMarks: {
    courseName: string;
    totalMarks: number;
    obtainedMarks: number;
  }[];
}

/**
 * Sub-schema for individual course marks (no separate _id needed).
 */
const CourseMarkSchema: Schema = new Schema(
  {
    courseName: { type: String, required: true },
    totalMarks: { type: Number, required: true },
    obtainedMarks: { type: Number, required: true },
  },
  { _id: false }
);

/**
 * Mark schema — stores marks for a student in a specific class.
 * Compound unique index ensures one mark record per student-class pair.
 */
const MarkSchema: Schema<MarkDocument> = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    courseMarks: { type: [CourseMarkSchema], default: [] },
  },
  { timestamps: true }
);

MarkSchema.index({ studentId: 1, classId: 1 }, { unique: true });

const MarkModel =
  mongoose.models.Mark ||
  mongoose.model<MarkDocument>("Mark", MarkSchema);

export default MarkModel;
