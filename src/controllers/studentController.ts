// src/controllers/studentController.ts

import { Student } from "@/types/student.types";
import { createStudentService, getStudentsService } from "@/services/studentService";

export async function createStudentController(data: Student) {
  return await createStudentService(data);
}

export async function getStudentsController() {
  return await getStudentsService();
}