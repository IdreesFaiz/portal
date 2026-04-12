/**
 * Student entity — mirrors the Mongoose Student schema fields.
 * `classId` references the ObjectId of the assigned Class document.
 * Null for "draft" students not yet assigned to a class.
 */
export interface Student {
  registrationNumber: string;
  rollNumber: string;
  name: string;
  parentName: string;
  email: string;
  phone: string;
  CNIC: string;
  classId: string | null;
}

/**
 * Student as returned from the API — includes Mongo-generated fields.
 */
export interface StudentWithId extends Student {
  _id: string;
  createdAt: string;
  updatedAt: string;
}
