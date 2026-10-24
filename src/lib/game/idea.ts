// Ulaz za AI prijedlog situacije (S9) iz stanja igre: hotel odabranog studenta ili, bez njega, najslabiji hotel igre.
// Odvojeno od situations.ts jer ono ne smije uvoziti iz "@/db/queries" (kružni uvoz).
import { countEvents, getCompanyInWorld, listCompanies, listFinanceRows, listRooms, logEvent } from "@/db/queries";
import type { CompanyRow, FinanceRow, RoomRow, WorldRow } from "@/db/schema";
import { HOTELS, getHotel } from "@/content";
import { progress } from "@/lib/engine/round";
import { HttpError } from "@/lib/http";
import type { GenerateSituationRequest, SituationIdeaInput } from "@/lib/types";
import { toFinance } from "./city";
import { toRoom } from "./views";

export const MAX_HINT = 300;

// Granice AI prijedloga po igri: igru može otvoriti svatko bez računa, a svaki prijedlog je plaćeni poziv modela.
// Brojimo događaje "situation.generated" u tablici events (bez promjene sheme). Nije u NEWS_TYPES pa ne ide u vijesti.
export const AI_PROPOSALS_PER_GAME = 30;
export const AI_PROPOSALS_PER_MINUTE = 5;
export const PROPOSAL_WINDOW_SECONDS = 60;
export const PROPOSAL_EVENT = "situation.generated";
const LIMIT_GAME = "Dosegnut je broj AI prijedloga za ovu igru";
const LIMIT_MINUTE = "Previše AI prijedloga u zadnjoj minuti. Pričekaj malo pa pokušaj ponovno.";

/** Poruka greške ako je granica dosegnuta (ukupno za igru ima prednost pred minutnom), inače null. */
export function checkProposalLimit(total: number, recent: number): string | null {
  if (total >= AI_PROPOSALS_PER_GAME) return LIMIT_GAME;
  if (recent >= AI_PROPOSALS_PER_MINUTE) return LIMIT_MINUTE;
  return null;
}

/**
 * Prije poziva AI-ja: dosegnuta granica → 429. Provjera i upis nisu atomični (neon-http nema transakcija), pa dva
 * istodobna zahtjeva na granici−1 mogu oba proći; jedan prijedlog viška je prihvatljiv.
 */
export async function assertProposalAllowed(worldId: string): Promise<void> {
  const { total, recent } = await countEvents(worldId, PROPOSAL_EVENT, PROPOSAL_WINDOW_SECONDS);
  const error = checkProposalLimit(total, recent);
  if (error) throw new HttpError(429, error);
}

/** Nakon uspješnog prijedloga: jedan događaj za brojanje, bez AI teksta. */
export async function recordProposal(world: Pick<WorldRow, "id" | "round">, companyId?: string): Promise<void> {
  await logEvent({ worldId: world.id, round: world.round, type: PROPOSAL_EVENT, payload: { companyId: companyId ?? null } });
}

/** GenerateSituationRequest iz nepouzdanog JSON-a; tip koji nije tekst → 400, natuknica skraćena na MAX_HINT. */
export function parseGenerateRequest(body: Record<string, unknown>): GenerateSituationRequest {
  const { companyId, hint } = body;
  const req: GenerateSituationRequest = {};
  if (companyId !== undefined && companyId !== null && companyId !== "") {
    if (typeof companyId !== "string") throw new HttpError(400, "Neispravan student");
    req.companyId = companyId.trim();
  }
  if (hint !== undefined && hint !== null) {
    if (typeof hint !== "string") throw new HttpError(400, "Natuknica mora biti tekst");
    const trimmed = hint.trim().slice(0, MAX_HINT);
    if (trimmed) req.hint = trimmed;
  }
  return req;
}

/** Ulaz iz tvrtke: ime hotela, mjesto i zvjezdice predloška, trenutni pokazatelji, sobe i zadnji obračun. */
export function ideaFromCompany(
  company: Pick<CompanyRow, "name" | "templateId" | "metrics">,
  rooms: RoomRow[],
  finances: FinanceRow[],
  hint?: string,
): SituationIdeaInput {
  const hotel = getHotel(company.templateId);
  const last = finances.reduce<FinanceRow | undefined>((a, f) => (!a || f.round > a.round ? f : a), undefined);
  return {
    hotelName: company.name,
    place: hotel.place,
    stars: hotel.stars,
    metrics: company.metrics,
    rooms: rooms.map(toRoom),
    ...(last && { finance: toFinance(last) }),
    ...(hint && { hint }),
  };
}

/** Igra bez studenata: prvi hotel iz banke s početnim pokazateljima, ime igre kao ime hotela. */
export function ideaFromBank(worldName: string, hint?: string): SituationIdeaInput {
  const hotel = HOTELS[0];
  return {
    hotelName: worldName,
    place: hotel.place,
    stars: hotel.stars,
    metrics: hotel.startMetrics,
    rooms: hotel.rooms.map((r) => ({ ...r, id: r.number })),
    ...(hint && { hint }),
  };
}

/** Odabrani student (tuđi ili nepostojeći → 404), inače student s najmanjim napretkom, inače hotel iz banke. */
export async function situationIdeaInput(world: WorldRow, req: GenerateSituationRequest): Promise<SituationIdeaInput> {
  let company: CompanyRow | undefined;
  if (req.companyId) {
    const found = await getCompanyInWorld(req.companyId, world.id);
    if (!found) throw new HttpError(404, "Nepoznat student");
    company = found.company;
  } else {
    const all = await listCompanies(world.id);
    company = all
      .map((c) => c.company)
      .reduce<CompanyRow | undefined>(
        (a, c) => (!a || progress(c.startMetrics, c.metrics) < progress(a.startMetrics, a.metrics) ? c : a),
        undefined,
      );
  }
  if (!company) return ideaFromBank(world.name, req.hint);
  const [rooms, finances] = await Promise.all([listRooms(company.id), listFinanceRows(company.id)]);
  return ideaFromCompany(company, rooms, finances, req.hint);
}
