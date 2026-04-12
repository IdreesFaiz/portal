/** Stable React Query keys — use with `useApiQuery` / invalidations. */
export const queryKeys = {
  root: ["api"] as const,
  students: () => [...queryKeys.root, "students"] as const,
  studentById: (id: string) => [...queryKeys.root, "students", id] as const,
  draftStudents: () => [...queryKeys.root, "students", "drafts"] as const,
  classes: () => [...queryKeys.root, "classes"] as const,
  classById: (id: string) => [...queryKeys.root, "classes", id] as const,
  classStudents: (classId: string) =>
    [...queryKeys.root, "classes", classId, "students"] as const,
  marks: () => [...queryKeys.root, "marks"] as const,
  marksByStudentAndClass: (studentId: string, classId: string) =>
    [...queryKeys.root, "marks", studentId, classId] as const,
  marksByClass: (classId: string) =>
    [...queryKeys.root, "marks", "class", classId] as const,
};
