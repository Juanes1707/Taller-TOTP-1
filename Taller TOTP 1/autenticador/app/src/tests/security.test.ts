import { createHash, createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { decodeBase32, isValidBase32 } from "../otp/base32";
import { hmacSha1 } from "../otp/hmac";
import { generateOtp, parseOtpauth } from "../otp/totp";
import { base64UrlEncode } from "../oauth/pkce";

const sha1WithNode = (bytes: Uint8Array) =>
  new Uint8Array(createHash("sha1").update(bytes).digest());

describe("Base32 Llave", () => {
  it("acepta minúsculas, espacios y relleno", () => {
    expect(isValidBase32("jbsw y3dp ehpk 3pxp===")).toBe(true);
    expect(decodeBase32("JBSW Y3DP EHPK3PXP")).toBeInstanceOf(Uint8Array);
  });
  it("rechaza caracteres inválidos", () => {
    expect(isValidBase32("LLAVE-!")).toBe(false);
  });
});

describe("RFC 6238 SHA-1", () => {
  const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
  const vectors = [
    [59000, "94287082"], [1111111100000, "07081804"], [1111111111000, "14050471"],
    [1234567890000, "89005924"], [2000000000000, "69279037"], [20000000000000, "65353130"]
  ] as const;
  it.each(vectors)("genera el vector %d", async (time, expected) => {
    await expect(generateOtp(secret, time, 8, sha1WithNode)).resolves.toBe(expected);
  });
});

describe("HMAC y otpauth", () => {
  it("HMAC coincide con node:crypto", async () => {
    const key = new TextEncoder().encode("llave");
    const message = new TextEncoder().encode("mensaje");
    const actual = await hmacSha1(key, message, sha1WithNode);
    const expected = createHmac("sha1", "llave").update("mensaje").digest();
    expect(Array.from(actual)).toEqual(Array.from(expected));
  });
  it("analiza URI Llave", () => {
    expect(parseOtpauth("otpauth://totp/Llave:cuenta?secret=JBSWY3DPEHPK3PXP&issuer=Llave")).toEqual({
      secret: "JBSWY3DPEHPK3PXP", issuer: "Llave", account: "cuenta"
    });
  });
});

describe("PKCE RFC 7636", () => {
  it("genera el vector de desafío correcto", () => {
    const verifier = "dBjftJeZ4CVP-mJ92TRMSWJ9ByHIsrsYYNyF4NLL2r8U";
    const hash = new Uint8Array(createHash("sha256").update(verifier).digest());
    expect(base64UrlEncode(hash)).toBe("P-u8PK4xTznR5VCbrEsvXcCgQe3k555r3TMc6uGjfhA");
  });
});

describe("OAuth callback in Expo Go", () => {
  it("allows AuthSession to choose the redirect scheme for the current runtime", () => {
    const loginSource = readFileSync(resolve(process.cwd(), "src/oauth/login.ts"), "utf8");
    expect(loginSource).not.toMatch(/makeRedirectUri\(\{\s*scheme:/);
    expect(loginSource).toContain("EXPO_PUBLIC_USE_EXPO_GO");
    expect(loginSource).toContain("NativeModules.SourceCode");
  });
});
