/**
 * Central list of app API paths. Import these instead of string literals.
 */
export const apiRoutes = {
  student: "/api/student",
  classes: "/api/classes",
  course: "/api/course",
} as const;

export type ApiRouteKey = keyof typeof apiRoutes;
