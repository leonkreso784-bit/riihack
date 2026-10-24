import type { CityBusiness, ContractTemplate, HotelTemplate, SituationTemplate } from "@/lib/types";
import cityJson from "./city.json";
import contractsJson from "./contracts.json";
import hotelsJson from "./hotels.json";
import situationsJson from "./situations.json";

export const HOTELS = hotelsJson as HotelTemplate[];
export const SITUATIONS = situationsJson as SituationTemplate[];
export const CITY = cityJson as CityBusiness[];
export const CONTRACTS = contractsJson as ContractTemplate[];

export function getHotel(id: string): HotelTemplate {
  const hotel = HOTELS.find((h) => h.id === id);
  if (!hotel) throw new Error(`Hotel ne postoji: ${id}`);
  return hotel;
}

export function getSituation(id: string): SituationTemplate {
  const situation = SITUATIONS.find((s) => s.id === id);
  if (!situation) throw new Error(`Situacija ne postoji: ${id}`);
  return situation;
}

export function getBusiness(id: string): CityBusiness {
  const business = CITY.find((b) => b.id === id);
  if (!business) throw new Error(`Tvrtka ne postoji: ${id}`);
  return business;
}

export function getContract(id: string): ContractTemplate {
  const contract = CONTRACTS.find((c) => c.id === id);
  if (!contract) throw new Error(`Ugovor ne postoji: ${id}`);
  return contract;
}
