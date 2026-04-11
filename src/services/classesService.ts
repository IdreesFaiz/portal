import ClassesModel from "@/models/classes";
import { Classes } from "@/types/classes.types";

export async function createClassesService(data: Classes) {
  if (!data.name) {
    throw new Error("All fields are required");
  }
  return await ClassesModel.create(data);
}

export async function getClassesService() {
  return await ClassesModel.find();
}
