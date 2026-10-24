// Better Auth kodovi grešaka → hrvatske poruke za registraciju i prijavu (L16).
const MESSAGES: Record<string, string> = {
  USER_ALREADY_EXISTS: "Račun s tim e-mailom već postoji",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Račun s tim e-mailom već postoji",
  PASSWORD_TOO_SHORT: "Lozinka mora imati barem 8 znakova",
  PASSWORD_TOO_LONG: "Lozinka je preduga",
  INVALID_EMAIL: "Upiši ispravan e-mail",
  INVALID_EMAIL_OR_PASSWORD: "Pogrešan e-mail ili lozinka",
};

export function authErrorMessage(error: { code?: string; status?: number } | null | undefined, fallback: string): string {
  if (error?.code && MESSAGES[error.code]) return MESSAGES[error.code];
  if (error?.status === 429) return "Previše pokušaja, pričekaj malo pa probaj ponovno";
  return fallback;
}
