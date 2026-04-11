import { Course } from "@/types/course.types";
import { createCourseService, getCourseService } from "@/services/courseService";

export async function createCourseController(data: Course) {
  return createCourseService(data);
}

export async function getCoursesController() {
  return getCourseService();
}
