import { useApiQuery } from "@/hooks/use-api";
import { apiRoutes } from "@/config/api-routes";
import { queryKeys } from "@/config/query-keys";
import type { StudentWithId } from "@/types/student.types";

/**
 * Fetches all students from the API.
 * Students are returned with populated classId field.
 */
export function useGetStudents() {
  return useApiQuery<StudentWithId[]>(queryKeys.students(), apiRoutes.student);
}
