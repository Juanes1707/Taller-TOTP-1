import { CryptoDigestAlgorithm, digest } from "expo-crypto";

export type Sha1Fn = (bytes: Uint8Array) => Uint8Array | Promise<Uint8Array>;

async function sha1(bytes: Uint8Array): Promise<Uint8Array> {
  const copy = new Uint8Array(bytes);
  return new Uint8Array(await digest(CryptoDigestAlgorithm.SHA1, copy));
}

export async function hmacSha1(key: Uint8Array, message: Uint8Array, sha1Fn: Sha1Fn = sha1): Promise<Uint8Array> {
  let keyBlock = key.length > 64 ? await sha1Fn(key) : key;
  const padded = new Uint8Array(64);
  padded.set(keyBlock);
  keyBlock = padded;
  const inner = new Uint8Array(64);
  const outer = new Uint8Array(64);
  for (let index = 0; index < 64; index += 1) {
    inner[index] = keyBlock[index] ^ 0x36;
    outer[index] = keyBlock[index] ^ 0x5c;
  }
  const innerData = new Uint8Array(64 + message.length);
  innerData.set(inner);
  innerData.set(message, 64);
  const innerDigest = await sha1Fn(innerData);
  const outerData = new Uint8Array(64 + innerDigest.length);
  outerData.set(outer);
  outerData.set(innerDigest, 64);
  return await sha1Fn(outerData);
}
