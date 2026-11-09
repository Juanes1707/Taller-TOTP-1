import { createHmac } from "node:crypto";
import { decodeBase32 } from "../utils/base32";

export function makeTotp(seed: string, moment = Date.now(), digits = 6, period = 30): string {
  const counter = Math.floor(moment / 1000 / period);
  const message = Buffer.alloc(8);
  message.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  message.writeUInt32BE(counter >>> 0, 4);
  const digest = createHmac("sha1", decodeBase32(seed)).update(message).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const value =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(value % (10 ** digits)).padStart(digits, "0");
}

export function validateTotp(seed: string, presentedCode: string, moment = Date.now(), windows = 1): boolean {
  if (!/^\d{6}$/.test(presentedCode)) return false;
  for (let delta = -windows; delta <= windows; delta++) {
    if (makeTotp(seed, moment + delta * 30_000) === presentedCode) return true;
  }
  return false;
}
