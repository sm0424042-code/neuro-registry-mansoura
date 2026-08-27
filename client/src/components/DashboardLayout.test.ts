import { describe, expect, it } from "vitest";
import { DEFAULT_ACCOUNT_DISPLAY_NAME, getSidebarAccountDisplayName } from "./DashboardLayout";

describe("Sidebar account display name", () => {
  it("uses Abdelrahman Ibrahim Rashad when the OAuth profile has no display name", () => {
    expect(DEFAULT_ACCOUNT_DISPLAY_NAME).toBe("Abdelrahman Ibrahim Rashad");
    expect(getSidebarAccountDisplayName(null)).toBe("Abdelrahman Ibrahim Rashad");
    expect(getSidebarAccountDisplayName("   ")).toBe("Abdelrahman Ibrahim Rashad");
  });

  it("keeps a real OAuth display name when the provider supplies one", () => {
    expect(getSidebarAccountDisplayName("Authenticated Account")).toBe("Authenticated Account");
  });
});
