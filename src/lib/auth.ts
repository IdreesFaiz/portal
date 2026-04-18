/** Token lifetime in seconds (30 minutes). */
const TOKEN_LIFETIME = 60 * 30;

/** Name of the auth cookie. */
export const AUTH_COOKIE = "admin_token";

interface JwtHeader {
  alg: "HS256";
  typ: "JWT";
}

interface JwtPayloadBase {
  iat: number;
  exp: number;
}

export interface AdminPayload extends JwtPayloadBase {
  email: string;
  role: string;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array | null {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  try {
    const binary = atob(`${normalized}${padding}`);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

function jsonToBase64Url(value: unknown): string {
  const json = JSON.stringify(value);
  return bytesToBase64Url(new TextEncoder().encode(json));
}

function parseBase64UrlJson<T>(value: string): T | null {
  const bytes = base64UrlToBytes(value);
  if (!bytes) return null;
  try {
    const text = new TextDecoder().decode(bytes);
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function toStableBytes(bytes: Uint8Array): Uint8Array {
  const stable = new Uint8Array(bytes.length);
  stable.set(bytes);
  return stable;
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

async function importHmacKey(secret: Uint8Array): Promise<CryptoKey> {
  const secretBytes = toStableBytes(secret);
  return crypto.subtle.importKey(
    "raw",
    secretBytes as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/** Type guard — validates decoded token has expected admin fields. */
function isAdminPayload(payload: unknown): payload is AdminPayload {
  if (typeof payload !== "object" || payload === null) return false;
  const candidate = payload as Record<string, unknown>;
  return (
    typeof candidate.email === "string" &&
    typeof candidate.role === "string" &&
    typeof candidate.iat === "number" &&
    typeof candidate.exp === "number"
  );
}

async function signPayload(payload: AdminPayload): Promise<string> {
  const header: JwtHeader = { alg: "HS256", typ: "JWT" };
  const encodedHeader = jsonToBase64Url(header);
  const encodedPayload = jsonToBase64Url(payload);
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const key = await importHmacKey(getJwtSecret());
  const signatureBytes = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(unsignedToken))
  );

  return `${unsignedToken}.${bytesToBase64Url(signatureBytes)}`;
}

/**
 * Validates admin credentials using bcrypt hash comparison and returns a signed JWT.
 * @throws Error if credentials are invalid or required env vars are missing.
 */
export async function authenticateAdmin(email: string, password: string): Promise<string> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminEmail || !adminHash) {
    throw new Error("Admin credentials are not configured (ADMIN_EMAIL, ADMIN_PASSWORD_HASH)");
  }

  if (email !== adminEmail) {
    throw new Error("Invalid email or password");
  }

  const { default: bcrypt } = await import("bcryptjs");
  const isMatch = await bcrypt.compare(password, adminHash);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  const now = Math.floor(Date.now() / 1000);
  return signPayload({
    email,
    role: "admin",
    iat: now,
    exp: now + TOKEN_LIFETIME,
  });
}

/**
 * Verifies a JWT token and returns the decoded payload.
 * Returns null if the token is invalid or expired.
 */
export async function verifyToken(token: string): Promise<AdminPayload | null> {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    return null;
  }

  const header = parseBase64UrlJson<JwtHeader>(encodedHeader);
  const payload = parseBase64UrlJson<unknown>(encodedPayload);
  const signatureBytes = base64UrlToBytes(encodedSignature);

  if (!header || header.alg !== "HS256" || header.typ !== "JWT") {
    return null;
  }
  if (!payload || !signatureBytes || !isAdminPayload(payload)) {
    return null;
  }

  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const key = await importHmacKey(getJwtSecret());
  const signatureForVerify = toStableBytes(signatureBytes);
  const unsignedTokenBytes = toStableBytes(new TextEncoder().encode(unsignedToken));
  const isValidSignature = await crypto.subtle.verify(
    "HMAC",
    key,
    signatureForVerify as BufferSource,
    unsignedTokenBytes as BufferSource
  );
  if (!isValidSignature) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    return null;
  }

  return payload;
}
