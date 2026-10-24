import { getHotel } from "@/content";
import { route } from "@/lib/http";
import { requirePlayer } from "@/lib/session";
import type { StaffMember } from "@/lib/types";

// Osoblje je iz predloška hotela, bez baze.
export const GET = route(async (): Promise<StaffMember[]> => {
  const { company } = await requirePlayer();
  return getHotel(company.templateId).staff;
});
