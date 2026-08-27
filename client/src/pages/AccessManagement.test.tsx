import { describe, expect, it } from "vitest";
import { ADMINISTRATOR_DISPLAY_NAME, getApplicantDisplayName } from "./AccessManagement";

describe("AccessManagement applicant display name", () => {
  it("uses the configured administrator display label for a missing or blank name", () => {
    expect(ADMINISTRATOR_DISPLAY_NAME).toBe("Abdelrahman Ibrahim Rashad");
    expect(getApplicantDisplayName(null)).toBe(ADMINISTRATOR_DISPLAY_NAME);
    expect(getApplicantDisplayName("   ")).toBe(ADMINISTRATOR_DISPLAY_NAME);
  });

  it("keeps an authenticated user-provided display name when available", () => {
    expect(getApplicantDisplayName("Research User")).toBe("Research User");
  });
});
