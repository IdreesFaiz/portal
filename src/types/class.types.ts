/**
 * A single course within a class — holds the course name and total marks.
 */
export interface Course {
  name: string;
  marks: number;
}

/**
 * Class creation payload — used when creating or updating a class.
 */
export interface Class {
  className: string;
  year: number;
  courses: Course[];
  resultsPublished: boolean;
}

/**
 * Class as returned from the API — includes Mongo-generated fields.
 */
export interface ClassWithId extends Class {
  _id: string;
  createdAt: string;
  updatedAt: string;
}
