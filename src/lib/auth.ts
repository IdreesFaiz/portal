import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import bcrypt from "bcryptjs";

/** Token lifetime in seconds (30 minutes). */
const TOKEN_LIFETIME = 60 * 30;

/** Name of the auth cookie. */
export const AUTH_COOKIE = "admin_token";

export interface AdminPayload extends JWTPayload {
  email: string;
  role: string;
}

/** Type guard — validates the decoded JWT contains the expected admin fields. */
function isAdminPayload(payload: JWTPayload): payload is AdminPayload {
  return typeof payload.email === "string" && typeof payload.role === "string";
}

/**
 * Lazily reads and encodes the JWT secret from the environment.
 * @throws Error if JWT_SECRET is not configured.
 */
function getJwtSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return new TextEncoder().encode(raw);
}

/**
 * Validates admin credentials using bcrypt hash comparison and returns a signed JWT.
 * @throws Error if credentials are invalid or required env vars are missing.
 */
export async function authenticateAdmin(
  email: string,
  password: string
): Promise<string> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminEmail || !adminHash) {
    throw new Error(
      "Admin credentials are not configured (ADMIN_EMAIL, ADMIN_PASSWORD_HASH)"
    );
  }

  if (email !== adminEmail) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, adminHash);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  const token = await new SignJWT({
    email,
    role: "admin",
  } satisfies AdminPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_LIFETIME}s`)
    .sign(getJwtSecret());

  return token;
}

/**
 * Verifies a JWT token and returns the decoded payload.
 * Returns null if the token is invalid or expired.
 */
export async function verifyToken(
  token: string
): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (!isAdminPayload(payload)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
