import { MAX_OWN_ANSWER_CHARS, MIN_OWN_ANSWER_CHARS } from "@/lib/rules";
import type { JoinRequest } from "@/lib/types";

const validName = (s: string) => s.trim().length >= 2 && s.trim().length <= 40;

export function validateJoin(input: JoinRequest): string | null {
  if (!validName(input.name)) return "Ime mora imati od 2 do 40 znakova";
  if (!validName(input.hotelName)) return "Ime hotela mora imati od 2 do 40 znakova";
  return null;
}

export function validateOwnAnswer(text: string): string | null {
  const len = text.trim().length;
  if (len < MIN_OWN_ANSWER_CHARS) return `Napiši barem jednu rečenicu (najmanje ${MIN_OWN_ANSWER_CHARS} znakova)`;
  if (len > MAX_OWN_ANSWER_CHARS) return `Odgovor je predug (najviše ${MAX_OWN_ANSWER_CHARS} znakova)`;
  return null;
}
