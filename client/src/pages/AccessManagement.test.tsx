import { describe, expect, it } from "vitest";
import { ADMINISTRATOR_DISPLAY_NAME, ADMINISTRATOR_INDICATOR_DESCRIPTION, ADMINISTRATOR_INDICATOR_LABEL, filterManagedAccounts, getApplicantDisplayName, getApplicantOAuthStatus } from "./AccessManagement";

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
  it("labels the derived OAuth identity state without exposing an identity value", () => {
    expect(getApplicantOAuthStatus(true)).toBe("OAuth linked");
    expect(getApplicantOAuthStatus(false)).toBe("Verification unavailable");
  });

  it("filters active account previews locally by name or provider email, role, and access state", () => {
    const accounts = [{ name: "Abdelrahman Ibrahim Rashad", email: "owner@example.edu", role: "admin" as const, accessStatus: "approved" as const }, { name: "Research Colleague", email: "colleague@example.edu", role: "user" as const, accessStatus: "pending" as const }];
    expect(filterManagedAccounts(accounts, "rashad", "all", "all")).toHaveLength(1);
    expect(filterManagedAccounts(accounts, "COLLEAGUE@EXAMPLE", "user", "pending")).toHaveLength(1);
    expect(filterManagedAccounts(accounts, "", "admin", "approved")).toEqual([accounts[0]]);
    expect(filterManagedAccounts(accounts, "missing", "all", "all")).toEqual([]);
  });
});
