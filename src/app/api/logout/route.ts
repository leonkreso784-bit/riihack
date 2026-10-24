import { route } from "@/lib/http";
import { clearSessionCookies } from "@/lib/session";

// Gumb Odjava (R0): briše kolačiće ovog uređaja; igra i hotel ostaju u bazi.
export const POST = route(async () => {
  await clearSessionCookies();
  return { ok: true };
});
