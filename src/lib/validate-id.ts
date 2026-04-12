import mongoose from "mongoose";
import { ValidationError } from "@/lib/error-message";

/**
 * Validates that a string is a valid MongoDB ObjectId.
 * @throws ValidationError (400) if the id format is invalid.
 */
export function validateObjectId(id: string, label = "Resource"): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError(`Invalid ${label} ID format`);
  }
}
