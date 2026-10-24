import { loadMail, sendMail } from "@/lib/game/mail";
import { route } from "@/lib/http";
import { readJson, requirePlayer } from "@/lib/session";
import type { MailMessage, SendMailRequest } from "@/lib/types";

// Pošta mog hotela (primljena i poslana), najnovije prvo.
export const GET = route(async (): Promise<MailMessage[]> => loadMail(await requirePlayer()));

// Poruka drugom hotelu iste igre (L18).
export const POST = route(async (req): Promise<MailMessage> => {
  const player = await requirePlayer();
  const body = await readJson(req);
  const request = {
    toCompanyId: body.toCompanyId,
    subject: body.subject,
    body: body.body,
  } as SendMailRequest; // oblik i duljinu provjerava sendMailError (400)
  return sendMail(player, request);
});
