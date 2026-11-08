import { describe, expect, it } from "vitest";
import { qrSvg } from "./qr";

describe("qrSvg", () => {
  it("draws an SVG QR code", async () => {
    const svg = await qrSvg("GUSTAV-7K2M-5EUR");
    expect(svg).toMatch(/^<svg[^>]*viewBox="0 0 \d+ \d+"/);
    expect(svg).toContain("<path");
  });

  it("gives the same code for the same text and a different one for other text", async () => {
    expect(await qrSvg("GUSTAV-A")).toBe(await qrSvg("GUSTAV-A"));
    expect(await qrSvg("GUSTAV-A")).not.toBe(await qrSvg("GUSTAV-B"));
  });
});
