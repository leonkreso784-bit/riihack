// Tokovi, skica 2: kako je odgovor prošao kroz hotel. Čista funkcija: ništa ne računa iznova, samo prikazuje pravila
// motora (engine/quality.ts, engine/round.ts) nad podacima koje student već ima. Brojke ne izmišljamo: što nedostaje, piše da nedostaje.
import { isWrittenAnswer, qualityFactor } from "@/lib/engine/round";
import { CLICK_QUALITY_CAP, DEPARTMENT_METRIC, FALLBACK_QUALITY, METRIC_LABELS, MISSED_QUALITY, STAFF_DEPARTMENT_LABELS } from "@/lib/rules";
import type { AnswerView, MetricKey, SituationView, StaffDepartment } from "@/lib/types";

export type FlowRubric = { id: string; text: string }[];
export type FlowEffects = Partial<Record<MetricKey, number>>;

export type AnswerFlowInput = {
  answer: AnswerView;
  rubric?: FlowRubric;
  effects?: FlowEffects;
  title: string;
  character: { name: string; role: string };
};

export type AnswerStepId = "odgovor" | "sudac" | "kvaliteta" | "ucinak" | "odjeli";
export type AnswerRow = { label: string; value: string; strong?: boolean };
export type AnswerStep = {
  id: AnswerStepId;
  title: string;
  small: string;
  big?: string;
  tone?: "dark" | "up" | "down";
  inputs: AnswerRow[];
  rule: string[];
  calc?: string;
  outputs: AnswerRow[];
  note?: string;
};

export const AI_NOTE = "Pravila računaju. AI samo glumi goste i označava kriterije.";
export const NO_EFFECTS_TEXT = "Učinak na pokazatelje vidiš u izvještaju mjeseca.";
export const CLOSE_NOTE = "Promjena se upisuje tek kad se mjesec zatvori (ti ga zatvoriš ili ga zatvori profesor ili rok). Do tada pokazatelji ostaju isti.";

// Rubrika i učinak stižu uz situaciju kad ih ugovor ima (zahtjev #178). Do tada su prazni i tok to kaže.
export function flowInputFromSituation(s: SituationView): AnswerFlowInput | null {
  if (!s.answer) return null;
  const extra = s as SituationView & { rubric?: FlowRubric; effects?: FlowEffects };
  return { answer: s.answer, rubric: extra.rubric, effects: extra.effects, title: s.title, character: s.character };
}

const MINUS = "−";
export function signed(n: number): string {
  return n > 0 ? `+${n}` : n < 0 ? `${MINUS}${-n}` : "0";
}

// Isto kao applyRound: Math.round(qualityFactor(kvaliteta, napisan) * učinak). Math.round(-0) pretvaramo u 0.
export function metricDelta(quality: number, effect: number, written = false): number {
  return Math.round(qualityFactor(quality, written) * effect) + 0;
}

export function criterionLabel(id: string, index: number): string {
  const m = /(\d+)$/.exec(id);
  return `Kriterij ${m ? m[1] : index + 1}`;
}

const MODE_TEXT = { click: "Odabrao si ponuđeni odgovor", own: "Napisao si svoj tekst", none: "Nisi odgovorio do kraja mjeseca" } as const;

export function activeEffects(effects?: FlowEffects): [MetricKey, number][] {
  if (!effects) return [];
  return (Object.entries(effects) as [MetricKey, number | undefined][]).filter((e): e is [MetricKey, number] => typeof e[1] === "number" && e[1] !== 0);
}

export function departmentsForMetric(metric: MetricKey): StaffDepartment[] {
  return (Object.keys(DEPARTMENT_METRIC) as StaffDepartment[]).filter((d) => DEPARTMENT_METRIC[d] === metric);
}

export function buildAnswerFlow(input: AnswerFlowInput): AnswerStep[] {
  const { answer, rubric, effects } = input;
  const q = answer.quality;
  const mode = answer.mode;
  const written = isWrittenAnswer(answer); // napisan svoj tekst: kvaliteta 1 vrijedi 0 (ADR-046)
  const met = [...new Set(answer.verdict?.criteriaMet ?? [])];
  const hasRubric = !!rubric && rubric.length > 0;
  const ef = activeEffects(effects);
  const steps: AnswerStep[] = [];

  // 1. Odgovor
  const how = mode === "own" ? (answer.copied ? "Svoj tekst, ali je prepisan ili zalijepljen" : "Svoj tekst") : mode === "click" ? "Klik na ponuđeni odgovor" : "Bez odgovora";
  steps.push({
    id: "odgovor",
    title: "Odgovor",
    small: how,
    tone: "dark",
    inputs: [
      { label: "Situacija", value: input.title },
      { label: "Lik", value: `${input.character.name}, ${input.character.role}` },
    ],
    rule: [MODE_TEXT[mode] + ".", ...(answer.copied ? [`Prepisan ili zalijepljen odgovor vrijedi najviše ${CLICK_QUALITY_CAP} od 5.`] : [])],
    outputs: [
      { label: "Način", value: mode === "own" ? "Svoj tekst" : mode === "click" ? "Klik" : "Bez odgovora" },
      { label: "Prepisano", value: answer.copied ? "Da" : "Ne" },
    ],
  });

  // 2. Sudac po rubrici
  const judgeOut: AnswerRow[] = [];
  let judgeSmall: string;
  let judgeNote: string | undefined;
  const judgeRule = ["AI samo označava koje je kriterije tvoj odgovor ispunio. Ne daje bodove i ne odlučuje o ocjeni."];
  if (mode === "own" && answer.verdict) {
    judgeSmall = hasRubric ? `Ispunjeno ${met.length} od ${rubric.length} kriterija` : `Ispunjeno kriterija: ${met.length}`;
    if (hasRubric) {
      const byId = new Map(rubric.map((c) => [c.id, c.text]));
      rubric.forEach((c, i) => judgeOut.push({ label: criterionLabel(c.id, i), value: `${met.includes(c.id) ? "Ispunjeno" : "Nije ispunjeno"}: ${c.text}` }));
      const unknown = met.filter((id) => !byId.has(id)).length;
      if (unknown) judgeNote = "Kriteriji kojih nema u rubrici ne broje se.";
    } else {
      judgeOut.push({ label: "Ispunjeno kriterija", value: String(met.length), strong: true });
      met.forEach((id, i) => judgeOut.push({ label: criterionLabel(id, i), value: "Ispunjeno" }));
      judgeNote = "Tekstove kriterija za sada ne vidiš, samo koliko ih je ispunjeno.";
    }
    if (answer.verdict.reasoning) judgeOut.push({ label: "Obrazloženje suca", value: answer.verdict.reasoning });
  } else if (mode === "own") {
    judgeSmall = "Sudac nije odgovorio";
    judgeRule.push(`Kad sudac ne odgovori, vrijedi zadana kvaliteta ${FALLBACK_QUALITY}.`);
    judgeOut.push({ label: "Presuda", value: "Nema" });
  } else if (mode === "click") {
    judgeSmall = "Ponuđeni odgovor ima unaprijed označene kriterije";
    judgeRule.push("Kod klika nema suđenja: svaki ponuđeni odgovor već ima popis kriterija koje pokriva.");
    judgeOut.push({ label: "Presuda", value: "Nije potrebna" });
  } else {
    judgeSmall = "Nema odgovora za suđenje";
    judgeOut.push({ label: "Presuda", value: "Nema" });
  }
  steps.push({
    id: "sudac",
    title: "Sudac po rubrici",
    small: judgeSmall,
    inputs: [{ label: "Tvoj odgovor", value: how }, { label: "Rubrika", value: hasRubric ? `${rubric.length} kriterija` : "Tekstovi nisu dostupni" }],
    rule: judgeRule,
    outputs: judgeOut,
    note: judgeNote,
  });

  // 3. Kvaliteta
  const qRule: string[] = [];
  let calc: string | undefined;
  if (mode === "none") {
    qRule.push(`Situacija bez odgovora dobiva kvalitetu ${MISSED_QUALITY}.`);
  } else if (mode === "click") {
    qRule.push("Kvaliteta je broj kriterija koje ponuđeni odgovor pokriva, najmanje 1.", `Ponuđeni odgovor vrijedi najviše ${CLICK_QUALITY_CAP} od 5.`);
  } else if (answer.verdict) {
    qRule.push("Kvaliteta je broj ispunjenih kriterija, najmanje 1 i najviše 5.");
    if (answer.copied) qRule.push(`Prepisan ili zalijepljen odgovor vrijedi najviše ${CLICK_QUALITY_CAP}.`);
    if (!answer.overridden) calc = `${met.length} ${met.length === 1 ? "kriterij" : "kriterija"} → kvaliteta ${q}`;
  } else {
    qRule.push(`Bez presude suca vrijedi zadana kvaliteta ${FALLBACK_QUALITY}.`);
  }
  if (answer.overridden) qRule.push("Profesor je promijenio ocjenu, pa vrijedi njegova.");
  steps.push({
    id: "kvaliteta",
    title: "Kvaliteta",
    small: answer.overridden ? "Profesor je promijenio ocjenu" : "Od 1 do 5",
    big: `${q} / 5`,
    tone: q >= 4 ? "up" : q === 3 ? undefined : "down",
    inputs: [
      { label: "Način", value: mode === "own" ? "Svoj tekst" : mode === "click" ? "Klik" : "Bez odgovora" },
      ...(mode === "own" && answer.verdict ? [{ label: "Ispunjeno kriterija", value: String(met.length) }] : []),
    ],
    rule: qRule,
    calc,
    outputs: [{ label: "Kvaliteta", value: `${q} / 5`, strong: true }, ...(answer.overridden ? [{ label: "Ocjena", value: "Promijenio profesor" }] : [])],
    note: answer.overridden ? "Profesor je promijenio ocjenu." : undefined,
  });

  // 4. Učinak
  if (ef.length === 0) {
    steps.push({
      id: "ucinak",
      title: "Učinak",
      small: "Vidi izvještaj mjeseca",
      inputs: [{ label: "Kvaliteta", value: `${q} / 5` }],
      rule: ["Promjena pokazatelja = množitelj kvalitete × učinak situacije. Množitelj: 1 → −2, 2 → 0, 3 → +1, 4 → +2, 5 → +3. Napisan svoj tekst (ne zalijepljen) s kvalitetom 1 vrijedi 0."],
      outputs: [{ label: "Pokazatelji", value: "Nisu prikazani za ovu situaciju" }],
      note: NO_EFFECTS_TEXT,
    });
    return steps;
  }
  const rows = ef.map(([k, e]) => ({ k, e, d: metricDelta(q, e, written) }));
  steps.push({
    id: "ucinak",
    title: "Učinak",
    small: rows.map((r) => `${METRIC_LABELS[r.k]} ${signed(r.d)}`).join(", "),
    inputs: [{ label: "Kvaliteta", value: `${q} / 5` }, ...rows.map((r) => ({ label: `Učinak: ${METRIC_LABELS[r.k]}`, value: String(r.e) }))],
    rule: ["Promjena pokazatelja = množitelj kvalitete × učinak situacije (1 → −2, 2 → 0, 3 → +1, 4 → +2, 5 → +3). Napisan svoj tekst (ne zalijepljen) s kvalitetom 1 vrijedi 0.", "Pokazatelj ostaje između 0 i 100."],
    calc: rows.map((r) => `${METRIC_LABELS[r.k]}: ${signed(qualityFactor(q, written))} × ${r.e} = ${signed(r.d)}`).join("  ·  "),
    outputs: rows.map((r) => ({ label: METRIC_LABELS[r.k], value: signed(r.d), strong: true })),
    note: CLOSE_NOTE,
  });

  // 5. Odjeli
  const out: AnswerRow[] = [];
  const who: string[] = []; // kratak opis za karticu: "Uprava +6, Financije (bez odjela) −4"
  for (const r of rows) {
    const deps = departmentsForMetric(r.k).map((d) => STAFF_DEPARTMENT_LABELS[d]);
    out.push({ label: METRIC_LABELS[r.k], value: deps.length ? `${deps.join(", ")} (${signed(r.d)})` : `Nema svog odjela (${signed(r.d)})` });
    who.push(`${deps.length ? deps.join(" te ") : `${METRIC_LABELS[r.k]} (bez odjela)`} ${signed(r.d)}`);
  }
  steps.push({
    id: "odjeli",
    title: "Odjeli",
    small: who.join(", "),
    inputs: rows.map((r) => ({ label: METRIC_LABELS[r.k], value: signed(r.d) })),
    rule: ["Svaki odjel prati jedan pokazatelj. Što se promijeni u pokazatelju, osjeti odjel koji ga prati."],
    outputs: out,
  });
  return steps;
}
