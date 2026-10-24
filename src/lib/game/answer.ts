// Odgovor na situaciju: klik ili vlastite riječi (presuda AI-ja po rubrici). Sprema se točno jednom i samo dok je
// krug otvoren; kvalitetu računa motor, AI vraća samo ispunjene kriterije.
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getSituationForCompany, logEvent } from "@/db/queries";
import { judge } from "@/lib/ai";
import { classifyOwnAnswer } from "@/lib/engine/copy";
import { qualityForOwn, qualityFromClick } from "@/lib/engine/quality";
import { roomStatusAfter } from "@/lib/engine/round";
import { validateOwnAnswer } from "@/lib/engine/validate";
import { HttpError } from "@/lib/http";
import type { requirePlayer } from "@/lib/session";
import type { AnswerMode, AnswerRequest, AnswerView, ChatTurn, JudgeInput, Quality, SituationTemplate, Verdict } from "@/lib/types";
import { renderTemplate } from "./views";

type PlayerCtx = Awaited<ReturnType<typeof requirePlayer>>;

export const ROUND_OVER = "Ovaj krug je završio";
export const ALREADY_ANSWERED = "Na ovu situaciju si već odgovorio";

export type ParsedAnswer = { kind: "click"; optionId: string } | { kind: "text"; text: string; pastedChars: number };

/** Tijelo zahtjeva → klik ili tekst; sve ostalo 400. */
export function parseAnswerRequest(body: Record<string, unknown>, optionIds: string[]): ParsedAnswer {
  if (body.optionId !== undefined) {
    if (typeof body.optionId !== "string" || !optionIds.includes(body.optionId)) {
      throw new HttpError(400, "Nepoznat ponuđeni odgovor");
    }
    return { kind: "click", optionId: body.optionId };
  }
  if (typeof body.text !== "string") throw new HttpError(400, "Odaberi ponuđeni odgovor ili napiši svoj");
  const text = body.text.trim();
  const invalid = validateOwnAnswer(text);
  if (invalid) throw new HttpError(400, invalid);
  const pasted = body.pastedChars ?? 0;
  if (typeof pasted !== "number" || !Number.isFinite(pasted) || pasted < 0) {
    throw new HttpError(400, "Neispravan broj zalijepljenih znakova");
  }
  return { kind: "text", text, pastedChars: Math.min(Math.floor(pasted), text.length) };
}

/** Zašto se na situaciju više ne može odgovoriti (poruka za 409), ili null. */
export function answerBlocked(
  situation: { round: number; state: string },
  company: { closedRound: number },
  world: { round: number; status: string; roundDeadline: Date | null },
  now: Date,
): string | null {
  if (situation.state === "answered") return ALREADY_ANSWERED;
  const roundOpen =
    world.status === "running" &&
    situation.round === world.round &&
    company.closedRound < situation.round &&
    situation.state === "open" &&
    (!world.roundDeadline || world.roundDeadline > now);
  return roundOpen ? null : ROUND_OVER;
}

export type Graded = {
  mode: AnswerMode;
  optionId: string | null;
  text: string | null;
  pastedChars: number;
  verdict: Verdict | null;
  quality: Quality;
  copied: boolean;
};

/**
 * Kvaliteta po pravilima plana (L7): klik → qualityFromClick; tekst prepisan od opcije → kvaliteta te opcije, kao
 * klik, copied, bez presude; zalijepljen tekst → presuda, najviše 4, copied; vlastiti tekst → presuda, do 5.
 * Presuda null (AI ne odgovori) → FALLBACK_QUALITY kroz qualityForOwn. `template` je već s upisanom sobom i hotelom.
 */
export async function gradeAnswer(
  parsed: ParsedAnswer,
  input: { template: SituationTemplate; hotelName: string; transcript: ChatTurn[] },
  judgeFn: (i: JudgeInput) => Promise<Verdict | null> = judge,
): Promise<Graded> {
  const { template } = input;
  if (parsed.kind === "click") {
    const option = template.options.find((o) => o.id === parsed.optionId)!;
    return { mode: "click", optionId: option.id, text: null, pastedChars: 0, verdict: null, quality: qualityFromClick(option), copied: false };
  }
  const { text, pastedChars } = parsed;
  const kind = classifyOwnAnswer(text, pastedChars, template.options);
  if (kind.kind === "copiedOption") {
    const option = template.options.find((o) => o.id === kind.optionId)!;
    return { mode: "click", optionId: option.id, text, pastedChars, verdict: null, quality: qualityFromClick(option), copied: true };
  }
  const verdict = await judgeFn({ template, hotelName: input.hotelName, text, transcript: input.transcript });
  const capped = kind.kind === "pasted";
  return { mode: "own", optionId: null, text, pastedChars, verdict, quality: qualityForOwn(verdict, template.rubric, capped), copied: capped };
}

export function toAnswerViewFromGraded(g: Graded): AnswerView {
  return {
    mode: g.mode,
    ...(g.optionId !== null && { optionId: g.optionId }),
    ...(g.text !== null && { text: g.text }),
    quality: g.quality,
    copied: g.copied,
    ...(g.verdict !== null && { verdict: g.verdict }),
  };
}

function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } } | null;
  return e?.code === "23505" || e?.cause?.code === "23505";
}

/**
 * Spremi odgovor u jednoj SQL naredbi (atomično): situacija open → answered samo ako je krug tvrtke još otvoren,
 * zatim odgovor i stanje sobe. Dva istodobna zahtjeva: drugi čeka zaključani redak situacije i ne nađe je više
 * open, pa se ne spremi ništa. Zatvaranje kruga uzima neodgovorene situacije istim uvjetom (open → expired).
 * Vraća true ako je odgovor spremljen.
 */
async function saveAnswer(
  ctx: PlayerCtx,
  situationId: string,
  g: Graded,
  room: { number: string; status: string } | null,
  now: Date,
): Promise<boolean> {
  const result = await db.execute<{ saved: number }>(sql`
    with claimed as (
      update situations set state = 'answered'
      where id = ${situationId}::uuid and company_id = ${ctx.company.id}::uuid and state = 'open'
        and exists (
          select 1 from companies c join worlds w on w.id = c.world_id
          where c.id = ${ctx.company.id}::uuid
            and c.closed_round < situations.round
            and w.status = 'running'
            and w.round = situations.round
            and (w.round_deadline is null or w.round_deadline > ${now.toISOString()}::timestamptz)
        )
      returning id
    ), saved as (
      insert into answers (id, situation_id, mode, option_id, text, pasted_chars, verdict, quality, copied)
      select ${crypto.randomUUID()}::uuid, claimed.id, ${g.mode}::text, ${g.optionId}::text, ${g.text}::text,
        ${g.pastedChars}::int, ${g.verdict === null ? null : JSON.stringify(g.verdict)}::jsonb, ${g.quality}::int,
        ${g.copied}::boolean
      from claimed
      returning id
    ), room as (
      update rooms set status = ${room?.status ?? "free"}::text
      where company_id = ${ctx.company.id}::uuid and number = ${room?.number ?? null}::text
        and exists (select 1 from saved)
      returning id
    )
    select count(*)::int as saved from saved
  `);
  return Number(result.rows[0]?.saved ?? 0) > 0;
}

export async function submitAnswer(ctx: PlayerCtx, situationId: string, req: AnswerRequest): Promise<AnswerView> {
  const found = await getSituationForCompany(situationId, ctx.company.id);
  if (!found) throw new HttpError(404, "Situacija ne postoji");
  const { situation } = found;
  const blocked = answerBlocked(situation, ctx.company, ctx.world, new Date());
  if (blocked) throw new HttpError(409, blocked);

  // Student vidi tekst s upisanom sobom i hotelom; isti tekst ide u prepoznavanje prepisivanja i presudu.
  const template = renderTemplate(found.template, { soba: situation.roomNumber ?? undefined, hotel: ctx.company.name });
  const parsed = parseAnswerRequest(
    req as unknown as Record<string, unknown>,
    template.options.map((o) => o.id),
  );
  const graded = await gradeAnswer(parsed, { template, hotelName: ctx.company.name, transcript: situation.transcript });

  const room =
    template.room && situation.roomNumber
      ? { number: situation.roomNumber, status: roomStatusAfter(graded.quality, template.room.problemStatus) }
      : null;
  let saved: boolean;
  try {
    // Novo vrijeme: presuda zna trajati do 20 s, a rok kruga je mogao proći u međuvremenu.
    saved = await saveAnswer(ctx, situation.id, graded, room, new Date());
  } catch (err) {
    if (isUniqueViolation(err)) throw new HttpError(409, ALREADY_ANSWERED); // zadnja obrana: unique answers.situation_id
    throw err;
  }
  if (!saved) {
    const now = await getSituationForCompany(situation.id, ctx.company.id);
    throw new HttpError(409, now?.situation.state === "answered" ? ALREADY_ANSWERED : ROUND_OVER);
  }

  await logEvent({
    worldId: ctx.world.id,
    companyId: ctx.company.id,
    round: situation.round,
    type: "answer.saved",
    payload: { situationId: situation.id, templateId: situation.templateId, mode: graded.mode, quality: graded.quality, copied: graded.copied },
  });
  return toAnswerViewFromGraded(graded);
}
