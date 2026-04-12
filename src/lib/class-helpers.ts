/** Type guard — checks if a classId value is a populated class object with className. */
function isPopulatedClass(value: unknown): value is { className: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "className" in value &&
    typeof (value as Record<string, unknown>).className === "string"
  );
}

/** Type guard — checks if a value has an _id property. */
function hasId(value: unknown): value is { _id: unknown } {
  return typeof value === "object" && value !== null && "_id" in value;
}

/**
 * Safely extracts the display class name from a populated classId field.
 * Handles both populated objects and raw ObjectId strings,
 * and returns "Unassigned" for null (draft students).
 */
export function getClassName(classId: unknown): string {
  if (classId === null || classId === undefined) {
    return "Unassigned";
  }
  if (isPopulatedClass(classId)) {
    return classId.className;
  }
  return String(classId);
}

/**
 * Safely extracts the raw class _id string from a populated classId field.
 * Returns empty string for null (draft students).
 */
export function getClassId(classId: unknown): string {
  if (classId === null || classId === undefined) {
    return "";
  }
  if (hasId(classId)) {
    return String(classId._id);
  }
  return String(classId);
}
