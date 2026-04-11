// src/types/enrollment.types.ts

import mongoose from "mongoose";

export interface Enrollment {
  studentId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  year?: number;
}