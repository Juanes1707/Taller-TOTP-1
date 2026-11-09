import * as Crypto from "expo-crypto";

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((value) => { binary += String.fromCharCode(value); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function makeVerifier(): string {
  return base64UrlEncode(Crypto.getRandomBytes(48));
}

export async function makeChallenge(verifier: string): Promise<string> {
  const hash = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(hash));
}

export function makeState(): string {
  return base64UrlEncode(Crypto.getRandomBytes(16));
}
