// src/types/result.types.ts

import mongoose from "mongoose";

export interface Result {
  enrollmentId: mongoose.Types.ObjectId;
  totalMarks: number;
  obtainedMarks: number;
  grade?: string;
  status?: "Pass" | "Fail";
}