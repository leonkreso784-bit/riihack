"use client";

// Stalne parcele hotela u pregledniku: parcela koju je hotel jednom dobio sprema se u localStorage (po tvom hotelu),
// pa se hotel ne seli kad se pridruži novi student ni nakon osvježavanja stranice. Vidi allocateLots u karta.ts.
import { useEffect, useMemo, useState } from "react";
import { allocateLots, type Lot } from "@/lib/karta";

const storageKey = (youId: string) => `simpolis-parcele:${youId}`;

function load(key: string): Record<string, number> {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? "{}") as Record<string, unknown>;
    return Object.fromEntries(Object.entries(raw).filter(([, v]) => Number.isInteger(v))) as Record<string, number>;
  } catch {
    return {};
  }
}

export function useCityLots(hotels: { companyId: string; place: string }[], youId: string): Record<string, Lot> {
  const key = storageKey(youId);
  const [store, setStore] = useState<{ key: string; map: Record<string, number> }>({ key: "", map: {} });
  if (store.key !== key) setStore({ key, map: typeof window === "undefined" ? {} : load(key) });
  const lots = useMemo(() => allocateLots(hotels, store.map), [hotels, store.map]);
  useEffect(() => {
    if (store.key !== key) return;
    const fresh = Object.entries(lots).filter(([id, l]) => store.map[id] !== l.index);
    if (!fresh.length) return;
    const map = { ...store.map, ...Object.fromEntries(fresh.map(([id, l]) => [id, l.index])) };
    try {
      localStorage.setItem(key, JSON.stringify(map));
    } catch {
      // privatni način ili pun prostor: raspored ostaje deterministički
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStore({ key, map });
  }, [lots, store, key]);
  return lots;
}
