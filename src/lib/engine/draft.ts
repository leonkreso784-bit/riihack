// Provjera profesorovog nacrta situacije (L12). Čista funkcija: tijelo zahtjeva je nepouzdan JSON, pa se provjeravaju
// i tipovi. Vraća poruku na hrvatskom ili null; toTemplate iz ispravnog nacrta uzme samo poznata polja.
import type {
  MetricKey,
  RoomStatus,
  RoomType,
  Skill,
  SituationDraft,
  SituationSource,
  SituationTemplate,
} from "@/lib/types";

const METRIC_KEYS: readonly MetricKey[] = ["guests", "reviews", "staff", "operations", "finance"];
const SKILLS: readonly Skill[] = ["empathy", "communication", "finance", "problemSolving", "ethics"];
const ROOM_TYPES: readonly RoomType[] = ["single", "double", "suite", "family"];
const ROOM_STATUSES: readonly RoomStatus[] = ["free", "occupied", "cleaning", "broken"];

const MAX_FIELD = 500; // lik, kriterij, opcija, područje: dovoljno za rečenicu ili dvije

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, min: number, max: number) =>
  typeof v === "string" && v.trim().length >= min && v.trim().length <= max;
const intIn = (v: unknown, min: number, max: number) =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

export function validateDraft(d: SituationDraft): string | null {
  if (!isObj(d)) return "Neispravan nacrt situacije";
  if (!str(d.title, 3, 80)) return "Naslov mora imati od 3 do 80 znakova";
  if (!str(d.text, 20, 1500)) return "Tekst situacije mora imati od 20 do 1500 znakova";
  if (!str(d.area, 1, 60)) return "Upiši područje situacije (do 60 znakova)";
  if (!intIn(d.difficulty, 1, 5)) return "Težina mora biti cijeli broj od 1 do 5";

  const c = d.character as unknown;
  if (!isObj(c) || !(["name", "role", "personality", "goal"] as const).every((k) => str(c[k], 1, MAX_FIELD))) {
    return "Ispuni lika: ime, ulogu, osobnost i cilj";
  }

  if (!Array.isArray(d.rubric) || d.rubric.length < 3 || d.rubric.length > 5) {
    return "Rubrika mora imati od 3 do 5 kriterija";
  }
  for (const r of d.rubric as unknown[]) {
    if (!isObj(r) || !str(r.id, 1, 40)) return "Svaki kriterij treba oznaku";
    if (!str(r.text, 1, MAX_FIELD) || !SKILLS.includes(r.skill as Skill)) return "Svaki kriterij treba tekst i vještinu";
  }
  const criteria = new Set(d.rubric.map((r) => r.id));
  if (criteria.size !== d.rubric.length) return "Kriteriji rubrike moraju imati različite oznake";

  if (!Array.isArray(d.options)) return "Ponuđeni odgovori moraju biti popis (smije biti prazan)";
  if (d.options.length > 4) return "Situacija smije imati najviše 4 ponuđena odgovora";
  for (const [i, o] of (d.options as unknown[]).entries()) {
    if (!isObj(o) || !str(o.id, 1, 40) || !str(o.text, 1, MAX_FIELD) || !Array.isArray(o.criteria)) {
      return `Opcija ${i + 1} treba oznaku, tekst i popis kriterija`;
    }
    if (!o.criteria.every((id) => typeof id === "string" && criteria.has(id))) {
      return `Opcija ${i + 1} ima kriterij koji nije u rubrici`;
    }
  }
  if (new Set(d.options.map((o) => o.id)).size !== d.options.length) {
    return "Ponuđeni odgovori moraju imati različite oznake";
  }

  if (!isObj(d.effects)) return "Odaberi barem jedan učinak na pokazatelje";
  const effects = Object.entries(d.effects);
  if (effects.length === 0) return "Odaberi barem jedan učinak na pokazatelje";
  for (const [k, v] of effects) {
    if (!METRIC_KEYS.includes(k as MetricKey)) return "Nepoznat pokazatelj u učincima";
    if (!intIn(v, 1, 5)) return "Učinak mora biti cijeli broj od 1 do 5";
  }

  if (d.room !== undefined && d.room !== null) {
    const room = d.room as unknown;
    if (!isObj(room) || !ROOM_TYPES.includes(room.type as RoomType) || !ROOM_STATUSES.includes(room.problemStatus as RoomStatus)) {
      return "Neispravna soba situacije";
    }
  }
  return null;
}

/** Id profesorove situacije: "custom-…", a AI prijedlog koji je profesor spremio "custom-ai-…" (izvor se vidi iz id-a). */
export function customSituationId(source: SituationSource, random: string = crypto.randomUUID()): string {
  const short = random.replaceAll("-", "").slice(0, 12);
  return source === "ai" ? `custom-ai-${short}` : `custom-${short}`;
}

/** Izvor predloška iz njegova id-a (za SituationView.source): banka iz sadržaja nema prefiks "custom-". */
export function sourceOfTemplateId(id: string): SituationSource {
  if (id.startsWith("custom-ai-")) return "ai";
  return id.startsWith("custom-") ? "custom" : "bank";
}

/** Predložak iz nacrta koji je prošao validateDraft: samo poznata polja, tekstovi bez razmaka na rubovima. */
export function toTemplate(id: string, d: SituationDraft): SituationTemplate {
  const t = (s: string) => s.trim();
  return {
    id,
    title: t(d.title),
    text: t(d.text),
    area: t(d.area),
    difficulty: d.difficulty,
    character: {
      name: t(d.character.name),
      role: t(d.character.role),
      personality: t(d.character.personality),
      goal: t(d.character.goal),
    },
    // Oznake kriterija i opcija ostaju kakve jesu: opcije se na njih pozivaju točno tim nizom.
    rubric: d.rubric.map((r) => ({ id: r.id, text: t(r.text), skill: r.skill })),
    options: d.options.map((o) => ({ id: o.id, text: t(o.text), criteria: [...o.criteria] })),
    effects: { ...d.effects },
    ...(d.room ? { room: { type: d.room.type, problemStatus: d.room.problemStatus } } : {}),
  };
}
