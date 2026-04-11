export interface Course {
  name: string;
  marks: number;
}

export interface Class {
  className: string;
  courses: Course[];
}