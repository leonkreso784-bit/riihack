// Croatian number formatting: 38800 → "38.800 €".
const nf = new Intl.NumberFormat("hr-HR");

export const num = (n: number) => nf.format(n);
export const eur = (n: number) => `${nf.format(n)} €`;
