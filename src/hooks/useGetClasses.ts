import { useApiQuery } from "@/hooks/use-api";
import { apiRoutes } from "@/config/api-routes";
import { queryKeys } from "@/config/query-keys";
import type { ClassWithId } from "@/types/class.types";

/**
 * Fetches all classes from the API.
 * Returns array of ClassWithId via the shared apiRequest helper.
 */
export function useGetClasses() {
  return useApiQuery<ClassWithId[]>(queryKeys.classes(), apiRoutes.classes);
}
