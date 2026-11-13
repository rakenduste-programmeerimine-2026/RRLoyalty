import { describe, expect, it } from "vitest";
import { perkRefusalMessage } from "./perk-messages";
import type { PerkRefusal } from "./perks";

const ALL: PerkRefusal[] = [
  "not_found",
  "not_a_prize",
  "already_chosen",
  "choice_closed",
  "choose_first",
  "already_used",
  "expired",
  "invalid_choice",
];

describe("perkRefusalMessage", () => {
  it("has an Estonian message for every refusal", () => {
    for (const refusal of ALL) expect(perkRefusalMessage(refusal)).toMatch(/\.$/);
  });

  it("tells the member a late choice became a gift card", () => {
    expect(perkRefusalMessage("choice_closed")).toContain("kinkekaardi");
  });
});
