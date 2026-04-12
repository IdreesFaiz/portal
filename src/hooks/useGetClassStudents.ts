import { useApiQuery } from "@/hooks/use-api";
import { apiRoutes } from "@/config/api-routes";
import { queryKeys } from "@/config/query-keys";
import type { StudentWithId } from "@/types/student.types";

/**
 * Fetches all students for a specific class.
 * Disabled when classId is empty.
 */
export function useGetClassStudents(classId: string) {
  return useApiQuery<StudentWithId[]>(
    queryKeys.classStudents(classId),
    apiRoutes.classByIdStudents(classId),
    { enabled: classId.length > 0 }
  );
}
