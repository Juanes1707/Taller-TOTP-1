import { createHash, timingSafeEqual } from "node:crypto";

export function createCodeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function matchesCodeVerifier(verifier: string, expectedChallenge: string): boolean {
  const actual = Buffer.from(createCodeChallenge(verifier));
  const expected = Buffer.from(expectedChallenge);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
