/**
 * Structured application error with an HTTP status code.
 * Throw this from service/validation layers for predictable error responses.
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

/** 404 — resource was not found. */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

/** 400 — client sent invalid or missing data. */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
    this.name = "ValidationError";
  }
}

/** 409 — conflict such as a duplicate key. */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
    this.name = "ConflictError";
  }
}

/** Human-readable field labels for duplicate key errors. */
const FIELD_LABELS: Record<string, string> = {
  registrationNumber: "Registration Number",
  rollNumber: "Roll Number",
  email: "Email",
  CNIC: "CNIC",
  phone: "Phone Number",
};

/**
 * Extracts a user-friendly error message from an unknown error.
 * Handles Mongo E11000 duplicate key errors specially.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (!(error instanceof Error)) {
    return "Something went wrong";
  }

  const msg = error.message;

  if (msg.includes("E11000") || msg.includes("duplicate key")) {
    for (const [field, label] of Object.entries(FIELD_LABELS)) {
      if (msg.includes(field)) {
        return `A student with this ${label} already exists. Please use a different value.`;
      }
    }
    return "A record with this value already exists. Please check for duplicates.";
  }

  return msg;
}

/**
 * Determines the appropriate HTTP status code from an error.
 * AppError subclasses carry their own statusCode; Mongoose/other errors
 * are classified by message substring as a fallback.
 */
export function errorStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }

  if (!(error instanceof Error)) return 500;

  const msg = error.message.toLowerCase();

  if (msg.includes("not found")) return 404;
  if (msg.includes("e11000") || msg.includes("duplicate key")) return 409;
  if (msg.includes("required") || msg.includes("validation") || msg.includes("invalid")) return 400;

  return 500;
}
