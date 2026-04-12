import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "@/hooks/use-api";
import { apiRoutes } from "@/config/api-routes";
import { queryKeys } from "@/config/query-keys";
import type { Class, ClassWithId } from "@/types/class.types";

/**
 * Creates a new class via POST /api/classes.
 * Invalidates the classes cache on success.
 */
export function useCreateClass() {
  const queryClient = useQueryClient();

  return useApiMutation<ClassWithId, Class>(apiRoutes.classes, {
    method: "POST",
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.classes() });
    },
  });
}
