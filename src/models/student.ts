import mongoose, { Schema, Document } from "mongoose";
import "@/models/class";

/**
 * Mongoose document interface for Student.
 * classId can be null for "draft" students not yet assigned to a class.
 */
export interface StudentDocument extends Document {
  registrationNumber: string;
  rollNumber: string;
  name: string;
  parentName: string;
  email: string;
  phone: string;
  CNIC: string;
  classId: mongoose.Types.ObjectId | null;
}

const StudentSchema: Schema<StudentDocument> = new Schema(
  {
    registrationNumber: { type: String, required: true, unique: true },
    rollNumber: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    parentName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    CNIC: { type: String, required: true, unique: true },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },
  },
  { timestamps: true }
);

StudentSchema.index({ classId: 1 });
StudentSchema.index({ rollNumber: 1, classId: 1 });

const StudentModel =
  mongoose.models.Student ||
  mongoose.model<StudentDocument>("Student", StudentSchema);

export default StudentModel;
