import { Classes } from "@/types/classes.types";
import { createClassesService, getClassesService } from "@/services/classesService";

export async function createClassesController(data: Classes) {
  return createClassesService(data);
}

export async function getClassesController() {
  return getClassesService();
}
