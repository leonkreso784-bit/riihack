// Fixed texts used when the AI is off, slow or failing (plan, S1).
import { METRIC_LABELS } from "@/lib/rules";
import type { MentorInput, Metrics, MetricKey, SituationDraft, SituationIdeaInput } from "@/lib/types";

export const CHARACTER_FALLBACK = "Ispričavam se, trenutno ne mogu razgovarati. Odgovorite mi pisano, molim vas.";
export const MENTOR_FALLBACK_QUESTION = "Koju bi odluku iz ovog kruga sljedeći put donio drukčije i zašto?";

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
  if (best.delta > 0) parts.push(`Najviše si podigao ${lower(best.key)} (${signed(best.delta)}/100).`);
  if (worst.delta < 0) parts.push(`Najviše su pali ${lower(worst.key)} (${signed(worst.delta)}/100).`);
  if (parts.length === 0) return "U ovom krugu se pokazatelji nisu promijenili. Što bi sljedeći put pokušao drukčije?";
  if (worst.delta < 0) parts.push(`Što bi sljedeći put napravio da ${lower(worst.key)} ne padnu?`);
  return parts.join(" ");
}

type Template = { title: string; text: string; area: string; character: SituationDraft["character"]; rubric: SituationDraft["rubric"] };

const PROPOSAL_TEMPLATES: Record<MetricKey, Template> = {
  guests: {
    title: "Gost nezadovoljan boravkom",
    text: "Gost na recepciji kaže da mu je boravak razočaravajući: soba nije bila spremna u dogovoreno vrijeme, a nitko mu se nije javio. Traži da mu hotel nekako nadoknadi neugodnost.",
    area: "recepcija",
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
    area: "recenzije",
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
    area: "osoblje",
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
    area: "održavanje",
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
    area: "rezervacije",
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
