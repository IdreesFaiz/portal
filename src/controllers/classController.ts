import {
  createClassService,
  getClassesService,
} from "@/services/classService";
import { Class } from "@/types/class.types";

export async function createClassController(data: Class) {
  return await createClassService(data);
}

export async function getClassesController() {
  return await getClassesService();
}