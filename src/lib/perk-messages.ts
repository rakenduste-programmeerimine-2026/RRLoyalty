// Estonian messages for the member when a prize choice or "Märgi kasutatuks"
// is refused (src/lib/perks.ts decides when). Pure, so it can be tested.

import type { PerkRefusal } from "./perks";

const MESSAGES: Record<PerkRefusal, string> = {
  not_found: "Seda hüve ei leitud.",
  not_a_prize: "Selles peatuses tasu valida ei saa.",
  already_chosen: "Selle tasu oled juba valinud.",
  choice_closed: "Valimise aeg on läbi – said automaatselt 5 € kinkekaardi.",
  choose_first: "Vali enne tasu.",
  already_used: "See hüve on juba kasutatud.",
  expired: "Selle hüve kehtivus on läbi.",
  invalid_choice: "Vali kinkekaart või annetus.",
};

export function perkRefusalMessage(refusal: PerkRefusal): string {
  return MESSAGES[refusal];
}
