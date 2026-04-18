import mongoose, { Schema, Document } from "mongoose";
import { Class } from "@/types/class.types";

export interface ClassDocument extends Class, Document {}

const CourseSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    marks: { type: Number, required: true },
  },
  { _id: false }
);

const ClassSchema: Schema<ClassDocument> = new Schema(
  {
    className: { type: String, required: true },
    year: { type: Number, required: true, default: () => new Date().getFullYear() },
    courses: { type: [CourseSchema], default: [] },
    resultsPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const ClassModel = mongoose.models.Class || mongoose.model<ClassDocument>("Class", ClassSchema);

export default ClassModel;
