// src/services/studentService.ts

import StudentModel from "@/models/student";
import { Student } from "@/types/student.types";

export async function createStudentService(data: Student) {
  // Validation
  const requiredFields = [
    "name",
    "parentName",
    "email",
    "phone",
    "registrationNumber",
    "rollNumber",
    "CNIC",
  ];

  for (const field of requiredFields) {
    if (!data[field as keyof Student]) {
      throw new Error(`Field "${field}" is required`);
    }
  }

  // Create student
  return await StudentModel.create(data);
}

export async function getStudentsService() {
  return await StudentModel.find();
}