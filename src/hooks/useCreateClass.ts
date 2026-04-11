import { useApiMutation } from "@/hooks/use-api";
import { apiRoutes } from "@/config/api-routes";
import type { Class } from "@/types/class.types";

export function useCreateClass() {
  return useApiMutation<any, Class>(apiRoutes.classes, {
    method: "POST",
  });
}