// Fixed texts used when the AI is off, slow or failing (plan, S1).
import { METRIC_LABELS } from "@/lib/rules";
import type { MentorInput, Metrics, MetricKey, SituationDraft, SituationIdeaInput } from "@/lib/types";

export const CHARACTER_FALLBACK = "Ispričavam se, trenutno ne mogu razgovarati. Odgovorite mi pisano, molim vas.";
export const MENTOR_FALLBACK_QUESTION = "Koja bi odluka iz ovog kruga sljedeći put bila drukčija i zašto?";

export function fallbackMentorQuestion(_input: MentorInput): string {
  return MENTOR_FALLBACK_QUESTION;
}

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0");
const lower = (key: MetricKey) => METRIC_LABELS[key].toLowerCase();

/** Debrief built only from the numbers: the metric that rose most and the one that fell most. */
export function fallbackDebrief(input: MentorInput): string {
  const deltas = (Object.keys(input.metricsAfter) as MetricKey[]).map((key) => ({
    key,
    delta: input.metricsAfter[key] - input.metricsBefore[key],
  }));
  const best = deltas.reduce((a, b) => (b.delta > a.delta ? b : a));
  const worst = deltas.reduce((a, b) => (b.delta < a.delta ? b : a));

  const parts: string[] = [];
  if (best.delta > 0) parts.push(`Najviše je porastao pokazatelj ${lower(best.key)} (${signed(best.delta)}/100).`);
  if (worst.delta < 0) parts.push(`Najviše je pao pokazatelj ${lower(worst.key)} (${signed(worst.delta)}/100).`);
  if (parts.length === 0) return "U ovom krugu se pokazatelji nisu promijenili. Što bi sljedeći put bilo drukčije?";
  if (worst.delta < 0) parts.push(`Što bi sljedeći put bilo drukčije da pokazatelj ${lower(worst.key)} ne padne?`);
  return parts.join(" ");
}

type Template = { title: string; text: string; area: string; character: SituationDraft["character"]; rubric: SituationDraft["rubric"] };

const PROPOSAL_TEMPLATES: Record<MetricKey, Template> = {
  guests: {
    title: "Gost nezadovoljan boravkom",
    text: "Gost na recepciji kaže da mu je boravak razočaravajući: soba nije bila spremna u dogovoreno vrijeme, a nitko mu se nije javio. Traži da mu hotel nekako nadoknadi neugodnost.",
    area: "Recepcija i smještaj",
    character: { name: "Ivan Marić", role: "gost", personality: "uljudan, ali razočaran i nestrpljiv", goal: "da ga hotel ozbiljno shvati i nadoknadi neugodnost" },
    rubric: [
      { id: "c1", skill: "empathy", text: "Prizna neugodnost i ispriča se bez prebacivanja krivnje [npr. \"razumijem da vam je bilo neugodno čekati\"]" },
      { id: "c2", skill: "problemSolving", text: "Ponudi konkretno rješenje [npr. nadogradnja sobe, kasnija odjava, besplatan doručak]" },
      { id: "c3", skill: "communication", text: "Pita gosta što mu je najvažnije ili što bi mu odgovaralo [npr. \"što bi vam sad najviše pomoglo?\"]" },
    ],
  },
  reviews: {
    title: "Loša recenzija na internetu",
    text: "Gost je na internetskoj stranici objavio recenziju od jedne zvjezdice zbog buke i hladnog doručka. Voditelj traži da napišeš javni odgovor koji će vidjeti budući gosti.",
    area: "Ugled i recenzije",
    character: { name: "Ana Perić", role: "voditeljica recepcije", personality: "praktična i pod pritiskom", goal: "javni odgovor koji štiti ugled hotela, a ne zvuči obrambeno" },
    rubric: [
      { id: "c1", skill: "empathy", text: "Zahvali na povratnoj informaciji i prizna gostovo nezadovoljstvo [npr. \"žao nam je što vam je boravak bio bučan\"]" },
      { id: "c2", skill: "communication", text: "Odgovori na konkretne primjedbe, a ne općenito [npr. spomene buku i doručak]" },
      { id: "c3", skill: "problemSolving", text: "Navede što će hotel promijeniti ili pozove gosta na daljnji razgovor [npr. e-adresa, nova prilika]" },
    ],
  },
  staff: {
    title: "Zaposlenik traži slobodan dan",
    text: "Sobarica te na početku smjene moli za slobodan dan jer joj je obitelj u nevolji, a hotel je sutra gotovo pun. Ostali zaposlenici već rade prekovremeno.",
    area: "Osoblje i smjene",
    character: { name: "Marija Kovač", role: "sobarica", personality: "vrijedna, umorna i zabrinuta", goal: "slobodan dan, ali ne želi ostaviti kolege na cjedilu" },
    rubric: [
      { id: "c1", skill: "empathy", text: "Pokaže razumijevanje za njezinu situaciju [npr. pita kako je i treba li joj što]" },
      { id: "c2", skill: "problemSolving", text: "Predloži rješenje za pokrivanje smjene [npr. zamjena s kolegicom, preraspodjela poslova]" },
      { id: "c3", skill: "ethics", text: "Ponaša se pošteno prema njoj i ostalim zaposlenicima [npr. ne obećava ono što ne može održati]" },
    ],
  },
  operations: {
    title: "Kvar u punom hotelu",
    text: "U subotu popodne u hotelu je otkazala perilica rublja, a sutra stiže grupa gostiju. Voditelj održavanja kaže da će popravak trajati barem dva dana i traži odluku što dalje.",
    area: "Održavanje i tehnika",
    character: { name: "Josip Babić", role: "voditelj održavanja", personality: "miran, stručan i kratak", goal: "brza odluka koja ne zaustavlja rad hotela" },
    rubric: [
      { id: "c1", skill: "problemSolving", text: "Predloži privremeno rješenje za rublje [npr. vanjska praonica, posudba opreme]" },
      { id: "c2", skill: "communication", text: "Odredi tko što radi i do kada [npr. rok za popravak, zadužena osoba]" },
      { id: "c3", skill: "finance", text: "Uzme u obzir trošak rješenja [npr. usporedi cijenu vanjske praonice s gubitkom]" },
    ],
  },
  finance: {
    title: "Gost traži popust na cijenu",
    text: "Gost koji je rezervirao tri noći traži popust od trideset posto jer je našao jeftiniju ponudu drugdje. Hotel je tog tjedna napola prazan, ali previše popusta bi pojelo zaradu.",
    area: "Recepcija i rezervacije",
    character: { name: "Petar Horvat", role: "gost", personality: "uporan pregovarač, ali pošten", goal: "što niža cijena, uz ostanak u hotelu" },
    rubric: [
      { id: "c1", skill: "finance", text: "Ponudi popust ili pogodnost koja štiti zaradu hotela [npr. manji popust, besplatan doručak umjesto sniženja]" },
      { id: "c2", skill: "communication", text: "Objasni vrijednost hotelske ponude, a ne samo cijenu [npr. lokacija, doručak, fleksibilno otkazivanje]" },
      { id: "c3", skill: "ethics", text: "Ostane pošten i ne obećava nešto što hotel ne može održati [npr. ne laže o cijeni konkurencije]" },
    ],
  },
};

/** Lowest metric; the first one in the fixed key order wins a tie. */
export function weakestMetric(metrics: Metrics): MetricKey {
  const keys = Object.keys(METRIC_LABELS) as MetricKey[];
  return keys.reduce((w, k) => (metrics[k] < metrics[w] ? k : w), keys[0]);
}

/** True for the fixed draft below, so the form can say it is not an AI draft (review UI-PROF-12). */
export function isFallbackProposal(draft: Pick<SituationDraft, "title">): boolean {
  return Object.values(PROPOSAL_TEMPLATES).some((t) => t.title === draft.title);
}

/** Simple valid draft for the weakest metric, used when the AI is off, slow or twice invalid. Own answer only, no options. */
export function fallbackProposal(input: SituationIdeaInput): SituationDraft {
  const key = weakestMetric(input.metrics);
  const t = PROPOSAL_TEMPLATES[key];
  return {
    title: t.title,
    text: t.text,
    area: t.area,
    difficulty: 2,
    character: { ...t.character },
    rubric: t.rubric.map((r) => ({ ...r })),
    options: [],
    effects: { [key]: 3 },
  };
}

// S11: agency reply when the AI is off or twice invalid. Same text as `agencyFallback` in game/mail.ts, copied here
// because game/mail.ts imports the AI module (a cycle otherwise). Keep both identical.
export type AgencyFallbackInput = {
  business: { name: string };
  contract: { nights: number };
  outcome: "accepted" | "countered" | "rejected";
  agreed: { pricePerNight: number; monthlyCost: number };
};

export function agencyReplyFallback(i: AgencyFallbackInput): string {
  const eur = (n: number) => `${n.toLocaleString("hr-HR")} €`;
  const parts: string[] = [];
  if (i.contract.nights > 0) parts.push(`${i.contract.nights} noćenja mjesečno po ${eur(i.agreed.pricePerNight)}`);
  if (i.agreed.monthlyCost > 0) parts.push(`naknada ${eur(i.agreed.monthlyCost)} mjesečno`);
  const terms = parts.join(", ");
  const sign = `Srdačan pozdrav,\n${i.business.name}`;
  switch (i.outcome) {
    case "accepted":
      return `Poštovani,\n\nprihvaćamo vaš prijedlog. Dogovoreno: ${terms}. Ugovor vrijedi od ovog mjeseca.\n\n${sign}`;
    case "countered":
      return `Poštovani,\n\ntoliko ne možemo, ali nađimo se na pola puta: ${terms}. Javite nam do kraja mjeseca prihvaćate li.\n\n${sign}`;
    case "rejected":
      return `Poštovani,\n\nnažalost, vaš je prijedlog predaleko od naše ponude, pa ovaj put odustajemo od suradnje.\n\n${sign}`;
  }
}

/** "Ponudi naknadu [npr. popust]" → "ponudi naknadu": the bracketed examples are for the judge, not for the student. */
const criterionPhrase = (text: string) => {
  const plain = text.replace(/\s*\[[^\]]*\]/g, "").trim().replace(/[.;:]+$/, "");
  return plain.charAt(0).toLowerCase() + plain.slice(1);
};
const isId = (s: string) => /^[a-z]{0,2}\d+$/i.test(s.trim());

/**
 * Automatic month review built only from the engine's numbers (no AI): what went well (best decision or biggest
 * rise), what did not (biggest fall and the weakest decision), one tip from a missed criterion, then the question.
 */
export function fallbackReview(input: MentorInput & { question?: string }): string {
  const deltas = (Object.keys(input.metricsAfter) as MetricKey[]).map((key) => ({
    key,
    delta: input.metricsAfter[key] - input.metricsBefore[key],
  }));
  const best = deltas.reduce((a, b) => (b.delta > a.delta ? b : a));
  const worst = deltas.reduce((a, b) => (b.delta < a.delta ? b : a));
  const answered = input.items.filter((i) => i.mode !== "none");
  const top = answered.reduce<MentorInput["items"][number] | undefined>((t, i) => (!t || i.quality > t.quality ? i : t), undefined);
  const weak = input.items.reduce<MentorInput["items"][number] | undefined>((w, i) => (!w || i.quality < w.quality ? i : w), undefined);

  const parts: string[] = [];
  if (top && top.quality >= 4) parts.push(`Dobro je riješena situacija „${top.title}“, kvaliteta ${top.quality} od 5.`);
  else if (best.delta > 0) parts.push(`Dobro je što je pokazatelj ${lower(best.key)} porastao (${signed(best.delta)}/100).`);
  else parts.push("Ovaj mjesec nijedan pokazatelj nije porastao.");

  if (worst.delta < 0) parts.push(`Najviše je pao pokazatelj ${lower(worst.key)} (${signed(worst.delta)}/100).`);
  if (input.finance) {
    const f = input.finance;
    parts.push(`Popunjenost je bila ${f.occupancyPct} %, a dobit mjeseca ${f.profit.toLocaleString("hr-HR")} €.`);
  }

  const missed = weak?.criteriaMissed.filter((m) => !isId(m)) ?? [];
  if (weak && weak !== top && weak.quality <= 3) {
    const why = weak.mode === "none" ? "nije bilo odgovora" : `kvaliteta ${weak.quality} od 5`;
    parts.push(`Najslabija odluka je „${weak.title}“ (${why}).`);
  }
  if (weak && missed.length > 0 && weak.quality <= 3) {
    parts.push(`Savjet za sljedeći mjesec: u sličnoj situaciji ${criterionPhrase(missed[0])}.`);
  } else if (worst.delta < 0) {
    parts.push(`Savjet za sljedeći mjesec: kod svake odluke prvo se zapitaj kako će djelovati na pokazatelj ${lower(worst.key)}.`);
  } else {
    parts.push("Savjet za sljedeći mjesec: kod svake odluke prvo se zapitaj koji će pokazatelj najviše dotaknuti.");
  }
  if (input.question?.trim()) parts.push(input.question.trim());
  return parts.join(" ");
}
