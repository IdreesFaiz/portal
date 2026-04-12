import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "@/hooks/use-api";
import { apiRoutes } from "@/config/api-routes";
import { queryKeys } from "@/config/query-keys";
import type { Student, StudentWithId } from "@/types/student.types";

/**
 * Creates a new student via POST /api/student.
 * Invalidates both students and classes cache on success (class student counts may change).
 */
export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useApiMutation<StudentWithId, Student>(apiRoutes.student, {
    method: "POST",
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.students() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.classes() });
    },
  });
}
