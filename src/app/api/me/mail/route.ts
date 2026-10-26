import { loadMail, sendMail } from "@/lib/game/mail";
import { route } from "@/lib/http";
import { readJson, requirePlayer } from "@/lib/session";
import type { MailMessage } from "@/lib/types";

// Pošta mog hotela (primljena i poslana), najnovije prvo.
export const GET = route(async (): Promise<MailMessage[]> => loadMail(await requirePlayer()));

// Poruka drugom hotelu iste igre (L18, #303). Pošiljatelj je hotel iz kolačića sp_player, nikad polje iz tijela;
// primatelj mora biti u istoj igri. Oblik, duljinu i granice slanja (400, 404, 409, 429) provjerava sendMail.
export const POST = route(async (req): Promise<MailMessage> => {
  const player = await requirePlayer();
  return sendMail(player, await readJson(req));
});
