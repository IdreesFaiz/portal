import type { Types } from "mongoose";

export interface Course {
  name: string;
  marks: number;
  class_id: Types.ObjectId | string;
}