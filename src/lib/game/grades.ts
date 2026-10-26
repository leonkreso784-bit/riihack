// Izvoz ocjena (CSV) za profesora igre: učitava studente, njihove situacije i naslove, a CSV slaže grades-csv.ts.
// Nema pisanja u bazu i nema nove tablice: ocjena je stupac answers.quality, koji override.ts već mijenja na licu mjesta.
import { listCompanies, listWorldGradeRows } from "@/db/queries";
import type { WorldRow } from "@/db/schema";
import { progress } from "@/lib/engine/round";
import type { SituationTemplate } from "@/lib/types";
import { buildGradesCsv, gradesFilename, type GradesInput } from "./grades-csv";
import { loadTemplates } from "./situations";
import type { CompanyWithPlayer } from "./views";

type GradeRows = Awaited<ReturnType<typeof listWorldGradeRows>>;

/**
 * Redci iz baze → ulaz za CSV. Samo studenti: botovi (kind "bot", ADR-044) nisu studenti i nemaju ocjenu. Napredak je
 * isti broj kao na ljestvici (progress početnih i trenutnih pokazatelja).
 */
export function toGradesInput(all: CompanyWithPlayer[], rows: GradeRows, templates: Pick<SituationTemplate, "id" | "title">[]): GradesInput {
  const byCompany = new Map<string, GradeRows>();
  for (const r of rows) byCompany.set(r.companyId, [...(byCompany.get(r.companyId) ?? []), r]);
  return {
    students: all
      .filter(({ company }) => company.kind !== "bot")
      .map(({ company, player }) => ({
        nickname: player.displayName,
        hotel: company.name,
        progress: progress(company.startMetrics, company.metrics),
        closedRound: company.closedRound,
        situations: (byCompany.get(company.id) ?? []).map(({ round, templateId, answer }) => ({ round, templateId, answer })),
      })),
    titles: Object.fromEntries(templates.map((t) => [t.id, t.title])),
  };
}

/** GET /api/prof/[worldId]/grades: datoteka s ocjenama svih studenata igre (pozivatelj je već provjerio vlasništvo). */
export async function exportGrades(world: WorldRow, now: Date = new Date()): Promise<{ filename: string; csv: string }> {
  const [all, rows, templates] = await Promise.all([listCompanies(world.id), listWorldGradeRows(world.id), loadTemplates(world.id)]);
  return { filename: gradesFilename(world.name, now), csv: buildGradesCsv(toGradesInput(all, rows, templates)) };
}
