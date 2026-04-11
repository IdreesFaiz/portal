/** Stable React Query keys — use with `useApiQuery` / invalidations. */
export const queryKeys = {
  root: ["api"] as const,
  students: () => [...queryKeys.root, "students"] as const,
  classes: () => [...queryKeys.root, "classes"] as const,
  courses: () => [...queryKeys.root, "courses"] as const,
};
