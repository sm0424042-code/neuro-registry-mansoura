import { describe, expect, it } from "vitest";
import { ADMINISTRATOR_DISPLAY_NAME, ADMINISTRATOR_INDICATOR_DESCRIPTION, ADMINISTRATOR_INDICATOR_LABEL, getApplicantDisplayName } from "./AccessManagement";

describe("AccessManagement applicant display name", () => {
  it("uses the configured administrator display label for a missing or blank name", () => {
    expect(ADMINISTRATOR_DISPLAY_NAME).toBe("Abdelrahman Ibrahim Rashad");
    expect(getApplicantDisplayName(null)).toBe(ADMINISTRATOR_DISPLAY_NAME);
    expect(getApplicantDisplayName("   ")).toBe(ADMINISTRATOR_DISPLAY_NAME);
  });

  it("keeps an authenticated user-provided display name when available", () => {
    expect(getApplicantDisplayName("Research User")).toBe("Research User");
  });

  it("keeps the configured administrator label available for the applicant-area indicator", () => {
    expect(ADMINISTRATOR_DISPLAY_NAME).toBe("Abdelrahman Ibrahim Rashad");
    expect(ADMINISTRATOR_INDICATOR_LABEL).toBe("Registry administrator");
    expect(ADMINISTRATOR_INDICATOR_DESCRIPTION).toBe("Manual access approver");
  });
});
