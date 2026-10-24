"use client";

import { useId, useState } from "react";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { api } from "@/lib/client";
import { METRIC_LABELS } from "@/lib/rules";
import type { LeaderboardRow, MetricKey, Skill, SituationDraft, SituationSummary } from "@/lib/types";
import { Field, FormError, SubmitButton } from "@/components/form";
import { Panel } from "@/components/panel";
import { Pill } from "@/components/pill";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const SKILL_LABELS: Record<Skill, string> = {
  empathy: "Empatija",
  communication: "Komunikacija",
  finance: "Financije",
  problemSolving: "Rješavanje problema",
  ethics: "Etika",
};

const METRIC_KEYS = Object.keys(METRIC_LABELS) as MetricKey[];
const MAX_CRITERIA = 5;
const MAX_OPTIONS = 4;
const FIELD_CLASS =
  "w-full rounded-xl border border-input bg-card px-4 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const ICON_BUTTON =
  "grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const GHOST_BUTTON =
  "inline-flex min-h-11 items-center gap-2 rounded-xl bg-secondary px-4 text-sm font-bold text-secondary-foreground transition-colors hover:bg-[#dbe7ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50";

type CriterionState = { id: string; text: string; skill: Skill };
type OptionState = { id: string; text: string; criteria: string[] };
type FormState = {
  title: string;
  text: string;
  area: string;
  difficulty: number;
  character: { name: string; role: string; personality: string; goal: string };
  criteria: CriterionState[];
  options: OptionState[];
  effects: Record<MetricKey, string>;
};

// Client-side mirror of the server's validateDraft (plan L12); the server stays the judge, this only saves a round trip.
export function validateForm(f: FormState): string[] {
  const errors: string[] = [];
  const title = f.title.trim();
  const text = f.text.trim();
  if (title.length < 3 || title.length > 80) errors.push("Naslov mora imati od 3 do 80 znakova.");
  if (text.length < 20 || text.length > 1500) errors.push("Opis situacije mora imati od 20 do 1500 znakova.");
  if (!f.area.trim()) errors.push("Upiši područje situacije (npr. Gosti).");
  const c = f.character;
  if (!c.name.trim() || !c.role.trim() || !c.personality.trim() || !c.goal.trim())
    errors.push("Ispuni lika: ime, ulogu, osobnost i cilj.");
  if (f.criteria.length < 3 || f.criteria.length > MAX_CRITERIA) errors.push("Rubrika mora imati od 3 do 5 kriterija.");
  if (f.criteria.some((k) => !k.text.trim())) errors.push("Svaki kriterij mora imati tekst.");
  if (f.options.length > MAX_OPTIONS) errors.push("Ponuđenih odgovora može biti najviše 4.");
  if (f.options.some((o) => !o.text.trim())) errors.push("Svaki ponuđeni odgovor mora imati tekst.");
  const ids = new Set(f.criteria.map((k) => k.id));
  if (f.options.some((o) => o.criteria.some((id) => !ids.has(id)))) errors.push("Odgovor se poziva na kriterij kojeg nema.");
  const filled = METRIC_KEYS.filter((k) => f.effects[k].trim() !== "");
  if (filled.some((k) => !/^[1-5]$/.test(f.effects[k].trim()))) errors.push("Učinak mora biti cijeli broj od 1 do 5.");
  else if (filled.length === 0) errors.push("Upiši učinak (1 do 5) na barem jedan pokazatelj.");
  return errors;
}

function toDraft(f: FormState): SituationDraft {
  const effects: Partial<Record<MetricKey, number>> = {};
  for (const k of METRIC_KEYS) if (f.effects[k].trim() !== "") effects[k] = Number(f.effects[k].trim());
  // Ids are assigned in order (c1..c5, o1..o4) whatever was added or removed while editing (Leon, S8 detail).
  const finalId = new Map(f.criteria.map((k, i) => [k.id, `c${i + 1}`]));
  return {
    title: f.title.trim(),
    text: f.text.trim(),
    area: f.area.trim(),
    difficulty: f.difficulty as SituationDraft["difficulty"],
    character: {
      name: f.character.name.trim(),
      role: f.character.role.trim(),
      personality: f.character.personality.trim(),
      goal: f.character.goal.trim(),
    },
    rubric: f.criteria.map((k, i) => ({ id: `c${i + 1}`, text: k.text.trim(), skill: k.skill })),
    options: f.options.map((o, i) => ({
      id: `o${i + 1}`,
      text: o.text.trim(),
      criteria: o.criteria.map((id) => finalId.get(id)!).sort(),
    })),
    effects,
  };
}

const initial: FormState = {
  title: "",
  text: "",
  area: "Gosti",
  difficulty: 3,
  character: { name: "", role: "", personality: "", goal: "" },
  criteria: [1, 2, 3].map((n) => ({ id: `c${n}`, text: "", skill: "communication" })),
  options: [],
  effects: { guests: "", reviews: "", staff: "", operations: "", finance: "" },
};

function fromDraft(d: SituationDraft): FormState {
  const effects: Record<MetricKey, string> = { guests: "", reviews: "", staff: "", operations: "", finance: "" };
  for (const k of METRIC_KEYS) if (d.effects[k] !== undefined) effects[k] = String(d.effects[k]);
  return {
    title: d.title,
    text: d.text,
    area: d.area,
    difficulty: d.difficulty,
    character: { ...d.character },
    criteria: d.rubric.map((k) => ({ id: k.id, text: k.text, skill: k.skill })),
    options: d.options.map((o) => ({ id: o.id, text: o.text, criteria: [...o.criteria] })),
    effects,
  };
}

function SelectField({ id, label, value, onChange, children }: { id: string; label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
      </Label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${FIELD_CLASS} h-12`}>
        {children}
      </select>
    </div>
  );
}

// S8: professor writes a situation. Internal criterion ids are never reused while editing; toDraft renumbers them c1..c5 in order.
export function SituationForm({ worldId, players = [], onCreated, onCancel }: { worldId: string; players?: LeaderboardRow[]; onCreated: (s: SituationSummary) => void; onCancel: () => void }) {
  const uid = useId();
  const [f, setF] = useState<FormState>(initial);
  const [nextCriterion, setNextCriterion] = useState(4);
  const [nextOption, setNextOption] = useState(1);
  const [errors, setErrors] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [aiSource, setAiSource] = useState(false);
  const [hint, setHint] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const id = (name: string) => `${uid}-${name}`;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setF((s) => ({ ...s, [key]: value }));
  const setCharacter = (key: keyof FormState["character"], value: string) => setF((s) => ({ ...s, character: { ...s.character, [key]: value } }));
  const patchCriterion = (cid: string, patch: Partial<CriterionState>) =>
    setF((s) => ({ ...s, criteria: s.criteria.map((k) => (k.id === cid ? { ...k, ...patch } : k)) }));
  const patchOption = (oid: string, patch: Partial<OptionState>) =>
    setF((s) => ({ ...s, options: s.options.map((o) => (o.id === oid ? { ...o, ...patch } : o)) }));
  const removeCriterion = (cid: string) =>
    setF((s) => ({
      ...s,
      criteria: s.criteria.filter((k) => k.id !== cid),
      options: s.options.map((o) => ({ ...o, criteria: o.criteria.filter((x) => x !== cid) })),
    }));

  async function suggest() {
    setGenerating(true);
    setAiError(null);
    try {
      const draft = await api.generateSituation(worldId, { ...(companyId ? { companyId } : {}), ...(hint.trim() ? { hint: hint.trim() } : {}) });
      setF(fromDraft(draft));
      setNextCriterion(draft.rubric.length + 1);
      setNextOption(draft.options.length + 1);
      setErrors([]);
      setAiSource(true);
    } catch (err) {
      setAiError((err as Error).message);
    }
    setGenerating(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (generating) return;
    setServerError(null);
    const found = validateForm(f);
    setErrors(found);
    if (found.length > 0) return;
    setBusy(true);
    try {
      onCreated(await api.createSituation(worldId, toDraft(f), aiSource ? "ai" : undefined));
    } catch (err) {
      setServerError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate aria-label="Nova situacija" className="space-y-6">
      <Panel title="AI prijedlog">
        <p className="mb-4 text-sm text-muted-foreground">AI samo predlaže. Ti pregledaš, urediš i spremiš; ništa ne ide studentima bez tebe.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={id("hint")} label="Tema (neobavezno), npr. bazen, alergija…" value={hint} onChange={(e) => setHint(e.target.value)} maxLength={120} disabled={generating} />
          <SelectField id={id("hotel")} label="Hotel (neobavezno)" value={companyId} onChange={setCompanyId}>
            <option value="">Cijeli razred</option>
            {players.map((p) => (
              <option key={p.companyId} value={p.companyId}>
                {p.hotelName} ({p.playerName})
              </option>
            ))}
          </SelectField>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" className={GHOST_BUTTON} onClick={suggest} disabled={generating}>
            <Sparkles className="size-4" aria-hidden /> {generating ? "AI piše nacrt…" : "Predloži AI-jem"}
          </button>
          {generating && <span role="status" className="text-sm text-muted-foreground">Može potrajati i 15 sekundi.</span>}
          {aiSource && !generating && <Pill tone="warn">AI nacrt, provjeri prije spremanja</Pill>}
        </div>
        {aiError && <div className="mt-3"><FormError>{aiError}</FormError></div>}
      </Panel>

      {/* While AI writes a draft the form is locked, so the draft cannot silently overwrite the professor's edits. */}
      <fieldset disabled={generating} className="m-0 min-w-0 space-y-6 border-0 p-0">
      <Panel title="Situacija">
        <div className="space-y-4">
          <Field id={id("title")} label="Naslov (3 do 80 znakova)" value={f.title} onChange={(e) => set("title", e.target.value)} maxLength={80} />
          <div className="space-y-2">
            <Label htmlFor={id("text")} className="text-sm font-semibold">
              Opis situacije (20 do 1500 znakova)
            </Label>
            <Textarea id={id("text")} value={f.text} onChange={(e) => set("text", e.target.value)} maxLength={1500} rows={4} className={`${FIELD_CLASS} py-3`} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={id("area")} label="Područje" value={f.area} onChange={(e) => set("area", e.target.value)} />
            <SelectField id={id("difficulty")} label="Težina" value={String(f.difficulty)} onChange={(v) => set("difficulty", Number(v))}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} od 5
                </option>
              ))}
            </SelectField>
          </div>
        </div>
      </Panel>

      <Panel title="Lik koji govori sa studentom">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={id("c-name")} label="Ime" value={f.character.name} onChange={(e) => setCharacter("name", e.target.value)} />
          <Field id={id("c-role")} label="Uloga (npr. gost u sobi 204)" value={f.character.role} onChange={(e) => setCharacter("role", e.target.value)} />
          <Field id={id("c-personality")} label="Osobnost (npr. ljut, ali pošten)" value={f.character.personality} onChange={(e) => setCharacter("personality", e.target.value)} />
          <Field id={id("c-goal")} label="Cilj (što lik želi postići)" value={f.character.goal} onChange={(e) => setCharacter("goal", e.target.value)} />
        </div>
      </Panel>

      <Panel title="Kriteriji dobrog odgovora (3 do 5)">
        <p className="mb-4 text-sm text-muted-foreground">
          Kriterij neka bude provjerljiv iz odgovora, npr. ‚Ponudi konkretnu djelomičnu naknadu (popust ili povrat)‘
        </p>
        <ul className="space-y-4">
          {f.criteria.map((k, i) => (
            <li key={k.id} className="flex items-end gap-2">
              <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
                <Field id={id(`k-${k.id}`)} label={`Kriterij ${i + 1}`} value={k.text} onChange={(e) => patchCriterion(k.id, { text: e.target.value })} />
                <SelectField id={id(`s-${k.id}`)} label={`Vještina kriterija ${i + 1}`} value={k.skill} onChange={(v) => patchCriterion(k.id, { skill: v as Skill })}>
                  {(Object.keys(SKILL_LABELS) as Skill[]).map((s) => (
                    <option key={s} value={s}>
                      {SKILL_LABELS[s]}
                    </option>
                  ))}
                </SelectField>
              </div>
              <button type="button" className={ICON_BUTTON} onClick={() => removeCriterion(k.id)} disabled={f.criteria.length <= 3} aria-label={`Ukloni kriterij ${i + 1}`}>
                <Trash2 className="size-5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className={`${GHOST_BUTTON} mt-4`}
          disabled={f.criteria.length >= MAX_CRITERIA}
          onClick={() => {
            set("criteria", [...f.criteria, { id: `c${nextCriterion}`, text: "", skill: "communication" }]);
            setNextCriterion(nextCriterion + 1);
          }}
        >
          <Plus className="size-4" aria-hidden /> Dodaj kriterij
        </button>
      </Panel>

      <Panel title="Ponuđeni odgovori (0 do 4)">
        <p className="mb-4 text-sm text-muted-foreground">Bez ponuđenih odgovora student piše vlastiti odgovor. Kvačicama označi koje kriterije svaki odgovor ispunjava.</p>
        <ul className="space-y-5">
          {f.options.map((o, i) => (
            <li key={o.id} className="rounded-xl border bg-muted/40 p-4">
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Field id={id(`o-${o.id}`)} label={`Odgovor ${i + 1}`} value={o.text} onChange={(e) => patchOption(o.id, { text: e.target.value })} />
                </div>
                <button type="button" className={ICON_BUTTON} aria-label={`Ukloni odgovor ${i + 1}`} onClick={() => set("options", f.options.filter((x) => x.id !== o.id))}>
                  <Trash2 className="size-5" aria-hidden />
                </button>
              </div>
              <fieldset className="mt-3">
                <legend className="mb-1 text-sm font-semibold">Ispunjava kriterije</legend>
                <div className="flex flex-wrap gap-x-5">
                  {f.criteria.map((k, ki) => (
                    <label key={k.id} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="size-5 accent-primary"
                        checked={o.criteria.includes(k.id)}
                        onChange={(e) => patchOption(o.id, { criteria: e.target.checked ? [...o.criteria, k.id] : o.criteria.filter((x) => x !== k.id) })}
                      />
                      <span>
                        Kriterij {ki + 1}
                        {k.text.trim() && <span className="text-muted-foreground">: {k.text.trim().slice(0, 40)}</span>}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className={`${GHOST_BUTTON} ${f.options.length ? "mt-4" : ""}`}
          disabled={f.options.length >= MAX_OPTIONS}
          onClick={() => {
            set("options", [...f.options, { id: `o${nextOption}`, text: "", criteria: [] }]);
            setNextOption(nextOption + 1);
          }}
        >
          <Plus className="size-4" aria-hidden /> Dodaj odgovor
        </button>
      </Panel>

      <Panel title="Učinak na pokazatelje (1 do 5, prazno = bez učinka)">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {METRIC_KEYS.map((k) => (
            <Field
              key={k}
              id={id(`e-${k}`)}
              label={METRIC_LABELS[k]}
              type="number"
              inputMode="numeric"
              min={1}
              max={5}
              step={1}
              value={f.effects[k]}
              onChange={(e) => set("effects", { ...f.effects, [k]: e.target.value })}
            />
          ))}
        </div>
      </Panel>

      {errors.length > 0 && (
        <FormError>
          <span className="block font-bold">Još nije spremno:</span>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {errors.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </FormError>
      )}
      {serverError && <FormError>{serverError}</FormError>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-12 rounded-xl border bg-card px-6 text-base font-bold transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Odustani
        </button>
        <div className="sm:w-56">
          <SubmitButton busy={busy} busyText="Spremam…">
            Spremi situaciju
          </SubmitButton>
        </div>
      </div>
      </fieldset>
    </form>
  );
}
