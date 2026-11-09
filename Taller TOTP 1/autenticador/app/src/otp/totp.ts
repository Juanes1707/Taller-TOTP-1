import { decodeBase32 } from "./base32";
import { hmacSha1, Sha1Fn } from "./hmac";

export function secondsRemaining(now = Date.now(), period = 30): number {
  return period - (Math.floor(now / 1000) % period);
}

export async function generateOtp(secret: string, now = Date.now(), digits = 6, sha1Fn?: Sha1Fn): Promise<string> {
  const counter = Math.floor(now / 1000 / 30);
  const data = new Uint8Array(8);
  let remaining = counter;
  for (let index = 7; index >= 0; index -= 1) {
    data[index] = remaining % 256;
    remaining = Math.floor(remaining / 256);
  }
  const digest = sha1Fn
    ? await hmacSha1(decodeBase32(secret), data, sha1Fn)
    : await hmacSha1(decodeBase32(secret), data);
  const offset = digest[digest.length - 1] & 15;
  const binary =
    ((digest[offset] & 127) << 24) |
    ((digest[offset + 1] & 255) << 16) |
    ((digest[offset + 2] & 255) << 8) |
    (digest[offset + 3] & 255);
  return String(binary % (10 ** digits)).padStart(digits, "0");
}

export function parseOtpauth(uri: string): { secret: string; issuer: string; account: string } | null {
  try {
    const parsed = new URL(uri);
    if (parsed.protocol !== "otpauth:" || parsed.host !== "totp") return null;
    const secret = parsed.searchParams.get("secret");
    if (!secret) return null;
    const label = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    const account = label.includes(":") ? label.split(":").slice(1).join(":") : label;
    return { secret, issuer: parsed.searchParams.get("issuer") ?? "Llave", account };
  } catch {
    return null;
  }
}
