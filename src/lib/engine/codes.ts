import { CODE_ALPHABET } from "@/lib/rules";

export function generateCode(length: number, rand: () => number = Math.random): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)];
  }
  return out;
}

export function normalizeCode(input: string): string {
  return input.replace(/[\s-]/g, "").toUpperCase();
}

export async function hashCode(code: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
