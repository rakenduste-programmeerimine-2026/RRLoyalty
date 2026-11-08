import { describe, expect, it } from "vitest";
import { ACCOUNT_HOME, safeNextPath, signInPath } from "./auth-redirect";

describe("safeNextPath", () => {
  it("keeps a path inside the app", () => {
    expect(safeNextPath("/konto/gustavi-rada")).toBe("/konto/gustavi-rada");
  });

  it("keeps the query string", () => {
    expect(safeNextPath("/konto/gustavi-rada/tasu?stop=100")).toBe(
      "/konto/gustavi-rada/tasu?stop=100",
    );
  });

  it("falls back to the account page when missing", () => {
    expect(safeNextPath(undefined)).toBe(ACCOUNT_HOME);
    expect(safeNextPath(null)).toBe(ACCOUNT_HOME);
    expect(safeNextPath("")).toBe(ACCOUNT_HOME);
  });

  it("rejects other sites", () => {
    expect(safeNextPath("https://evil.example")).toBe(ACCOUNT_HOME);
    expect(safeNextPath("//evil.example")).toBe(ACCOUNT_HOME);
    expect(safeNextPath("/\\evil.example")).toBe(ACCOUNT_HOME);
    expect(safeNextPath("konto")).toBe(ACCOUNT_HOME);
  });

  it("does not send a signed-in member back to the sign-in page", () => {
    expect(safeNextPath("/logi-sisse")).toBe(ACCOUNT_HOME);
  });
});

describe("signInPath", () => {
  it("remembers where the visitor was going", () => {
    expect(signInPath("/konto/gustavi-rada")).toBe("/logi-sisse?next=%2Fkonto%2Fgustavi-rada");
  });
});
