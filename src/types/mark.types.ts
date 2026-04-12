/**
 * A single course mark entry — ties a course name to the obtained marks.
 */
export interface CourseMark {
  courseName: string;
  totalMarks: number;
  obtainedMarks: number;
}

/**
 * Marks creation/update payload for a student in a given class.
 */
export interface MarkPayload {
  studentId: string;
  classId: string;
  courseMarks: CourseMark[];
}

/**
 * Mark record as returned from the API — includes Mongo-generated fields.
 */
export interface MarkWithId extends MarkPayload {
  _id: string;
  createdAt: string;
  updatedAt: string;
}
