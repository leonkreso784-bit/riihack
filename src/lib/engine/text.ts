export function renderSituationText(text: string, vars: { soba?: string; hotel: string }): string {
  return text.replaceAll("{soba}", vars.soba ?? "").replaceAll("{hotel}", vars.hotel);
}
