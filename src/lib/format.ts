// Croatian number formatting: 38800 → "38.800 €".
const nf = new Intl.NumberFormat("hr-HR");

export const num = (n: number) => nf.format(n);
export const eur = (n: number) => `${nf.format(n)} €`;

// Croatian plural: 1, 21, 31… → one; 2–4, 22–24… → few; 0, 5–20, 25… → many (11–14 always many).
export function plural(n: number, one: string, few: string, many: string) {
  const a = Math.abs(n);
  if (a % 10 === 1 && a % 100 !== 11) return one;
  return [2, 3, 4].includes(a % 10) && ![12, 13, 14].includes(a % 100) ? few : many;
}

export const messagesLeft = (n: number) => `Još ${n} ${plural(n, "poruka", "poruke", "poruka")}`;
export const unreadLabel = (n: number) => `${n} ${plural(n, "nepročitana", "nepročitane", "nepročitanih")}`;
export const charsLeft = (n: number) => `Još najmanje ${n} ${plural(n, "znak", "znaka", "znakova")}`;
export const starsLabel = (n: number) => `${n} ${plural(n, "zvjezdica", "zvjezdice", "zvjezdica")}`;
