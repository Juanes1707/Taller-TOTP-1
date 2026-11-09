const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function decodeBase32(seed: string): Buffer {
  const normalized = seed.trim().toUpperCase().replace(/=+$/, "").replace(/[^A-Z2-7]/g, "");
  const output: number[] = [];
  let accumulator = 0;
  let bitCount = 0;

  for (const character of normalized) {
    const value = ALPHABET.indexOf(character);
    if (value === -1) throw new Error("Semilla Base32 inválida");
    accumulator = (accumulator << 5) | value;
    bitCount += 5;
    if (bitCount >= 8) {
      bitCount -= 8;
      output.push((accumulator >>> bitCount) & 0xff);
    }
  }
  return Buffer.from(output);
}
