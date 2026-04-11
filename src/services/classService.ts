import ClassModel from "@/models/class";
import type { Class } from "@/types/class.types";

export async function createClassService(data: Class) {
  if (!data.className?.trim()) {
    throw new Error("Class name is required");
  }

  const filteredCourses = (data.courses || [])
    .filter((c) => c.name?.trim() && c.marks > 0)
    .map((c) => ({
      name: c.name.trim(),
      marks: Number(c.marks),
    }));

  return await ClassModel.create({
    className: data.className.trim(),
    courses: filteredCourses,
  });
}

export async function getClassesService() {
  return await ClassModel.find().sort({ createdAt: -1 });
}