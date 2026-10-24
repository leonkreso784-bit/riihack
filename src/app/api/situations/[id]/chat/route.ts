// S3: POST /api/situations/[id]/chat. One student message in, the character's reply out as a text stream.
import { streamCharacterReply } from "@/lib/ai";
import { appendTranscript, getSituationForCompany } from "@/db/queries";
import { HttpError } from "@/lib/http";
import { MAX_STUDENT_MESSAGES, PASTE_SHARE } from "@/lib/rules";
import { requirePlayer } from "@/lib/session";
import type { ChatRequest } from "@/lib/types";

const MAX_MESSAGE_CHARS = 1000;

// Not wrapped in `route()` because that returns JSON; errors are turned into the same { error } body here.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const { id } = await ctx.params;
    const { company } = await requirePlayer();

    const body = (await req.json().catch(() => null)) as Partial<ChatRequest> | null;
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) throw new HttpError(400, "Napiši poruku");
    if (message.length > MAX_MESSAGE_CHARS) throw new HttpError(400, "Poruka je preduga");
    const pastedChars = typeof body?.pastedChars === "number" && body.pastedChars > 0 ? body.pastedChars : 0;

    const found = await getSituationForCompany(id, company.id);
    if (!found) throw new HttpError(404, "Situacija nije pronađena");
    const { situation, template } = found;

    const sent = situation.transcript.filter((t) => t.role === "student").length;
    if (situation.state !== "open" || sent >= MAX_STUDENT_MESSAGES) throw new HttpError(409, "Razgovor je gotov");

    return streamCharacterReply(
      {
        template,
        hotelName: company.name,
        roomNumber: situation.roomNumber ?? undefined,
        transcript: situation.transcript,
        message,
        pasted: pastedChars / message.length > PASTE_SHARE,
        messageNo: sent + 1,
        maxMessages: MAX_STUDENT_MESSAGES,
      },
      undefined,
      (reply) =>
        appendTranscript(situation.id, [
          { role: "student", text: message },
          { role: "character", text: reply },
        ]),
    );
  } catch (err) {
    if (err instanceof HttpError) return Response.json({ error: err.message }, { status: err.status });
    console.error(err);
    return Response.json({ error: "Nešto je pošlo po zlu. Pokušaj ponovno." }, { status: 500 });
  }
}
