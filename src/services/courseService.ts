import CourseModel from "@/models/course";
import { Course } from "@/types/course.types";

export async function createCourseService(data: Course) {
  if (!data.name || data.marks == null || !data.class_id) {
    throw new Error("All fields are required");
  }
  return await CourseModel.create(data);
}

export async function getCourseService() {
  return await CourseModel.find();
}
