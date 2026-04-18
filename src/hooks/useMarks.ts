import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery, useApiMutation } from "@/hooks/use-api";
import { apiRoutes } from "@/config/api-routes";
import { queryKeys } from "@/config/query-keys";
import type { MarkPayload, MarkWithId } from "@/types/mark.types";

/**
 * Fetches marks for a specific student in a specific class.
 * Disabled when either id is empty.
 */
export function useGetMarks(studentId: string, classId: string) {
  const endpoint = `${apiRoutes.marks}?studentId=${studentId}&classId=${classId}`;

  return useApiQuery<MarkWithId | null>(
    queryKeys.marksByStudentAndClass(studentId, classId),
    endpoint,
    { enabled: studentId.length > 0 && classId.length > 0 }
  );
}

/**
 * Fetches ALL marks for every student in a specific class.
 * Used by the spreadsheet-style bulk entry grid.
 */
export function useGetMarksByClass(classId: string) {
  const endpoint = `${apiRoutes.marksByClass}?classId=${classId}`;

  return useApiQuery<MarkWithId[]>(queryKeys.marksByClass(classId), endpoint, {
    enabled: classId.length > 0,
  });
}

/**
 * Creates or updates marks via POST /api/marks.
 * Invalidates the specific marks cache and the class marks cache on success.
 */
export function useUpsertMarks(studentId: string, classId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<MarkWithId, MarkPayload>(apiRoutes.marks, {
    method: "POST",
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.marksByStudentAndClass(studentId, classId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.marksByClass(classId),
      });
    },
  });
}

/**
 * Bulk saves marks for multiple students in a class.
 * Sends { entries: MarkPayload[] } to POST /api/marks/bulk.
 */
export function useBulkUpsertMarks(classId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<MarkWithId[], { entries: MarkPayload[] }>(apiRoutes.marksBulk, {
    method: "POST",
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.marksByClass(classId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.marks(),
      });
    },
  });
}
