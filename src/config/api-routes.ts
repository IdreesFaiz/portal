/**
 * Central list of app API paths.
 * Import these instead of string literals throughout the app.
 */
export const apiRoutes = {
  student: "/api/student",
  studentById: (id: string) => `/api/student/${id}`,
  studentReport: (id: string) => `/api/student/${id}/report`,
  studentLookup: "/api/student/lookup",
  studentDrafts: "/api/student/drafts",
  studentExport: "/api/student/export",
  classes: "/api/classes",
  classById: (id: string) => `/api/classes/${id}`,
  classByIdStudents: (id: string) => `/api/classes/${id}/students`,
  classPromote: (id: string) => `/api/classes/${id}/promote`,
  marks: "/api/marks",
  marksBulk: "/api/marks/bulk",
  marksByClass: "/api/marks/class",
  authLogin: "/api/auth/login",
  authLogout: "/api/auth/logout",
  authMe: "/api/auth/me",
} as const;

export type ApiRouteKey = keyof typeof apiRoutes;
