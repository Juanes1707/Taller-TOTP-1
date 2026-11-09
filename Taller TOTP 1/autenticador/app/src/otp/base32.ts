const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function isValidBase32(text: string): boolean {
  const normalized = text.trim().replace(/\s/g, "").replace(/=+$/, "").toUpperCase();
  return normalized.length > 0 && [...normalized].every((letter) => alphabet.indexOf(letter) >= 0);
}

export function decodeBase32(text: string): Uint8Array {
  const normalized = text.trim().replace(/\s/g, "").replace(/=+$/, "").toUpperCase();
  let accumulator = 0;
  let bits = 0;
  const bytes: number[] = [];
  for (const letter of normalized) {
    const value = alphabet.indexOf(letter);
    if (value < 0) throw new Error("Base32 inválida: usa solo A-Z y 2-7.");
    accumulator = (accumulator << 5) | value;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((accumulator >>> bits) & 255);
    }
  }
  return new Uint8Array(bytes);
}
