// Croatian number formatting: 38800 → "38.800 €".
const nf = new Intl.NumberFormat("hr-HR");

export const num = (n: number) => nf.format(n);
export const eur = (n: number) => `${nf.format(n)} €`;

// Croatian plural for the chat counter: 1 poruka, 2–4 poruke, 5+ poruka (11–14 always "poruka").
export function messagesLeft(n: number) {
  const few = [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100);
  return `Još ${n} ${few ? "poruke" : "poruka"}`;
}
