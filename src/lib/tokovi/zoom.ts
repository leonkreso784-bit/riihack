// Čista matematika zumiranja za platno Tokova (bez DOM-a, pa se može testirati).
// Zoom se čuva kao cijeli broj postotaka, da nema pogrešaka s pomičnim zarezom (0,1 + 0,2 !== 0,3).

export const ZOOM_MIN = 50;
export const ZOOM_MAX = 150;
export const ZOOM_STEP = 10;
export const ZOOM_DEFAULT = 100;

/** Ctrl ili Cmd + kotačić: toliko piksela kotačića treba skupiti za jedan korak (miš daje 100 po zarezu, touchpad puno sitnih). */
export const WHEEL_THRESHOLD = 40;

/** Zaokruži na cijeli postotak i drži unutar 50 do 150. Nevaljan broj (NaN, Infinity) vraća zadanih 100. */
export function clampZoom(value: number): number {
  if (!Number.isFinite(value)) return ZOOM_DEFAULT;
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value)));
}

/** Jedan korak od 10 %, uvijek na mrežu desetica: s 87 % gore je 90 %, dolje 80 %. */
export function stepZoom(current: number, direction: 1 | -1): number {
  const z = clampZoom(current);
  const next = direction > 0 ? (Math.floor(z / ZOOM_STEP) + 1) * ZOOM_STEP : (Math.ceil(z / ZOOM_STEP) - 1) * ZOOM_STEP;
  return clampZoom(next);
}

/** Zoom na kojem cijelo platno stane u vidljivu širinu. Zaokružuje prema dolje da nikad ne ostane vodoravni klizač. */
export function fitZoom(viewportWidth: number, contentWidth: number): number {
  if (!(viewportWidth > 0) || !(contentWidth > 0)) return ZOOM_DEFAULT;
  return clampZoom(Math.floor((viewportWidth / contentWidth) * 100));
}

/** Može li se zoom još pomaknuti u tom smjeru (za onemogućene gumbe). */
export function canStep(current: number, direction: 1 | -1): boolean {
  return stepZoom(current, direction) !== clampZoom(current);
}

/**
 * Ctrl ili Cmd + kotačić: zbraja male pomake kotačića i javlja kad se skupio jedan korak.
 * deltaY manji od nule (kotačić gore, razmicanje prstiju) znači približi. Smjer se promijeni, zbroj kreće ispočetka.
 * deltaMode: 0 pikseli, 1 retci, 2 stranice (Firefox miš šalje retke).
 */
export function wheelStep(pending: number, deltaY: number, deltaMode = 0): { direction: 1 | -1 | 0; pending: number } {
  const px = deltaY * (deltaMode === 1 ? 16 : deltaMode === 2 ? 100 : 1);
  if (!Number.isFinite(px) || px === 0) return { direction: 0, pending };
  const sum = (pending !== 0 && Math.sign(pending) !== Math.sign(px) ? 0 : pending) + px;
  if (Math.abs(sum) < WHEEL_THRESHOLD) return { direction: 0, pending: sum };
  return { direction: sum < 0 ? 1 : -1, pending: 0 };
}

/**
 * Novi scroll koji drži istu točku platna ispod sidra (npr. pokazivača ili sredine prozora).
 * scroll: trenutni scrollLeft, anchor: položaj sidra unutar vidljivog prozora u px.
 */
export function anchoredScroll(scroll: number, anchor: number, fromZoom: number, toZoom: number): number {
  if (!(fromZoom > 0) || !(toZoom > 0)) return Math.max(0, scroll);
  return Math.max(0, Math.round(((scroll + anchor) * toZoom) / fromZoom - anchor));
}

/** Vrijednost iz sessionStoragea u valjan zoom, ili null ako je nema ili je pokvarena. */
export function parseStoredZoom(raw: string | null | undefined): number | null {
  if (raw == null || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? clampZoom(n) : null;
}

export const zoomLabel = (zoom: number) => `${clampZoom(zoom)} %`;
