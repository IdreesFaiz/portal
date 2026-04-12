"use client";

import { useApiQuery } from "@/hooks/use-api";
import { apiRoutes } from "@/config/api-routes";
import { queryKeys } from "@/config/query-keys";
import type { StudentWithId } from "@/types/student.types";

/**
 * Fetches all students in "draft" state (classId is null).
 * These students need class assignment from the admin.
 */
export function useGetDraftStudents() {
  return useApiQuery<StudentWithId[]>(
    queryKeys.draftStudents(),
    apiRoutes.studentDrafts
  );
}
