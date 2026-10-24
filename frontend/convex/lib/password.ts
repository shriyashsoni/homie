// Pure crypto helpers using Web Crypto (available in the Convex runtime).
// - sha256Hex is deterministic → usable in queries & mutations.
// - randomTokenHex / hashPassword use getRandomValues → actions only.

const enc = new TextEncoder();

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

const ITERATIONS = 100_000;

async function pbkdf2(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial, 256,
  );
  return new Uint8Array(bits);
}

/** Create a PBKDF2 hash string: `pbkdf2$<iter>$<saltHex>$<hashHex>` (ACTION only) */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt);
  return `pbkdf2$${ITERATIONS}$${toHex(salt)}$${toHex(hash)}`;
}

/** Verify a password against a stored hash string (ACTION only) */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, , saltHex, hashHex] = stored.split("$");
  if (scheme !== "pbkdf2" || !saltHex || !hashHex) return false;
  const computed = await pbkdf2(password, fromHex(saltHex));
  const expected = fromHex(hashHex);
  if (computed.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed[i] ^ expected[i];
  return diff === 0;
}

/** Random opaque session token (ACTION only) */
export function randomTokenHex(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

/** Deterministic SHA-256 hex — safe in queries & mutations */
export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(input));
  return toHex(new Uint8Array(digest));
}
