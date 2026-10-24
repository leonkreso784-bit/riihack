import { loadMail } from "@/lib/game/mail";
import { route } from "@/lib/http";
import { requirePlayer } from "@/lib/session";
import type { MailMessage } from "@/lib/types";

// Pošta mog hotela (primljena i poslana), najnovije prvo.
export const GET = route(async (): Promise<MailMessage[]> => loadMail(await requirePlayer()));
