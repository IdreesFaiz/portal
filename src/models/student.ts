// src/models/student.ts

import mongoose, { Schema, Document } from "mongoose";
import { Student } from "@/types/student.types";

export interface StudentDocument extends Student, Document {}

const StudentSchema: Schema<StudentDocument> = new Schema(
  {
    registrationNumber: { type: String, required: true, unique: true },
    rollNumber: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    parentName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    CNIC: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const StudentModel =
  mongoose.models.Student || mongoose.model<StudentDocument>("Student", StudentSchema);

export default StudentModel;