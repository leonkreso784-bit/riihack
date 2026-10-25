// Profesor mijenja ocjenu mentora (L12, M3): profesor ima zadnju riječ o kvaliteti odgovora, a brojke i dalje računa
// motor. Ako je krug tvrtke već obračunat, pokazatelji se pomaknu za (množitelj nove − množitelj stare) × učinak
// predloška, rezano na 0–100, isto kao zatvaranje kruga (applyRound, qualityFactor s napisanim odgovorom, ADR-046); ako krug još traje, mijenja se samo ocjena i zatvaranje uzme novu.
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { answers, companies, situations } from "@/db/schema";
import type { WorldRow } from "@/db/schema";
import { isUuid } from "@/db/queries";
import { isWrittenAnswer, qualityFactor, roomStatusAfter } from "@/lib/engine/round";
import { HttpError } from "@/lib/http";
import type { AnswerView, MetricKey, Metrics, Quality } from "@/lib/types";
import { getTemplate } from "./situations";
import { toAnswerView } from "./views";

const KEYS: MetricKey[] = ["guests", "reviews", "staff", "operations", "finance"];

export const NO_ANSWER = "Na ovu situaciju još nema odgovora";

// ---------- Čiste funkcije (testovi u override.test.ts) ----------

/** QualityOverrideRequest iz nepouzdanog JSON-a; sve osim cijelog broja 1–5 → 400. */
export function parseQualityOverride(body: Record<string, unknown>): Quality {
  const q = body.quality;
  if (typeof q !== "number" || !Number.isInteger(q) || q < 1 || q > 5) {
    throw new HttpError(400, "Ocjena mora biti cijeli broj od 1 do 5");
  }
  return q as Quality;
}

/**
 * Pomak pokazatelja kad se ocjena promijeni: zatvaranje s novom ocjenom − zatvaranje sa starom, za svaki ključ učinaka
 * predloška, s istim množiteljem kao applyRound. `written` = napisan svoj tekst (napisan odgovor s ocjenom 1 vrijedi 0).
 */
export function overrideDelta(
  from: Quality,
  to: Quality,
  effects: Partial<Record<MetricKey, number>>,
  written = false,
): Partial<Record<MetricKey, number>> {
  const delta: Partial<Record<MetricKey, number>> = {};
  for (const k of KEYS) {
    const e = effects[k];
    if (e) delta[k] = Math.round(qualityFactor(to, written) * e) - Math.round(qualityFactor(from, written) * e);
  }
  return delta;
}

/** Pokazatelji + pomak, rezano na 0–100. Isto računa SQL u overrideQuality, ali nad vrijednošću u bazi. */
export function shiftMetrics(metrics: Metrics, delta: Partial<Record<MetricKey, number>>): Metrics {
  const out = { ...metrics };
  for (const k of KEYS) out[k] = Math.min(100, Math.max(0, out[k] + (delta[k] ?? 0)));
  return out;
}

// ---------- Baza ----------

/**
 * jsonb stupac pokazatelja + pomak, rezano na 0–100, kao jedan SQL izraz nad trenutnom vrijednošću (kao addMetricsSql
 * u round.ts), pa se istodobni upisi (obračun mjeseca, druga promjena ocjene) ne gaze.
 */
function shiftedMetricsSql(column: "metrics" | "metrics_after", delta: Partial<Record<MetricKey, number>>) {
  const col = sql.raw(column);
  const parts = KEYS.map(
    (k) => sql`${k}::text, least(100, greatest(0, (${col} ->> ${k}::text)::int + ${delta[k] ?? 0}::int))`,
  );
  return sql`jsonb_build_object(${sql.join(parts, sql`, `)})`;
}

/**
 * POST /api/prof/[worldId]/answers/[situationId]/quality. Situacija druge igre ili nepostojeća → 404, bez odgovora →
 * 409. Ista ocjena → trenutno stanje bez promjena.
 *
 * Sve ide u jednoj SQL naredbi (atomično, kao saveAnswer u answer.ts): odgovor dobije novu ocjenu samo ako još ima
 * staru (dupli klik ili dvije kartice: drugi zahtjev ne nađe staru ocjenu i ne pomiče ništa), pa tek tada
 * izvještaj kruga (metrics_after) i pokazatelji tvrtke, soba po roomStatusAfter i događaj answer.overridden.
 * Pokazatelji se pomiču samo ako je tvrtka zatvorila krug i izvještaj kruga postoji: zatvaranje upisuje izvještaj
 * i pokazatelje zajedno, pa bez izvještaja krug još nije obračunat i zatvaranje će uzeti novu ocjenu.
 */
export async function overrideQuality(world: WorldRow, situationId: string, quality: Quality): Promise<AnswerView> {
  const to = parseQualityOverride({ quality });
  if (!isUuid(situationId)) throw new HttpError(404, "Situacija ne postoji");
  const [found] = await db
    .select({ situation: situations, answer: answers })
    .from(situations)
    .innerJoin(companies, eq(companies.id, situations.companyId))
    .leftJoin(answers, eq(answers.situationId, situations.id))
    .where(and(eq(situations.id, situationId), eq(companies.worldId, world.id)))
    .limit(1);
  if (!found) throw new HttpError(404, "Situacija ne postoji");
  const { situation, answer } = found;
  if (!answer) throw new HttpError(409, NO_ANSWER);
  const from = answer.quality as Quality;
  if (from === to) return toAnswerView(answer);

  const template = await getTemplate(world.id, situation.templateId);
  const delta = overrideDelta(from, to, template.effects, isWrittenAnswer(answer));
  const room =
    template.room && situation.roomNumber
      ? { number: situation.roomNumber, status: roomStatusAfter(to, template.room.problemStatus) }
      : null;
  const payload = { situationId: situation.id, templateId: situation.templateId, from, to };

  const result = await db.execute<{ changed: number }>(sql`
    with changed as (
      update answers set quality = ${to}::int, overridden = true
      where id = ${answer.id}::uuid and quality = ${from}::int
      returning id
    ), report as (
      update round_reports set metrics_after = ${shiftedMetricsSql("metrics_after", delta)}
      where company_id = ${situation.companyId}::uuid and round = ${situation.round}::int
        and exists (select 1 from changed)
        and exists (
          select 1 from companies c where c.id = ${situation.companyId}::uuid and c.closed_round >= ${situation.round}::int
        )
      returning id
    ), company as (
      update companies set metrics = ${shiftedMetricsSql("metrics", delta)}
      where id = ${situation.companyId}::uuid and exists (select 1 from report)
      returning id
    ), room as (
      update rooms set status = ${room?.status ?? "free"}::text
      where company_id = ${situation.companyId}::uuid and number = ${room?.number ?? null}::text
        and exists (select 1 from changed)
      returning id
    ), event as (
      insert into events (id, world_id, company_id, round, type, payload)
      select ${crypto.randomUUID()}::uuid, ${world.id}::uuid, ${situation.companyId}::uuid, ${situation.round}::int,
        'answer.overridden', ${JSON.stringify(payload)}::jsonb || jsonb_build_object('metricsShifted', exists (select 1 from company))
      from changed
      returning id
    )
    select (select count(*) from changed)::int as changed
  `);
  const changed = Number(result.rows[0]?.changed ?? 0) > 0;

  const [now] = await db.select().from(answers).where(eq(answers.id, answer.id)).limit(1);
  // Nije promijenjeno: netko je ocjenu upravo promijenio. Ista ocjena (dupli klik) je uspjeh, druga je sukob.
  if (!changed && now?.quality !== to) {
    throw new HttpError(409, "Ocjenu je upravo promijenio netko drugi. Osvježi i pokušaj ponovno.");
  }
  return toAnswerView(now ?? { ...answer, quality: to, overridden: true });
}
