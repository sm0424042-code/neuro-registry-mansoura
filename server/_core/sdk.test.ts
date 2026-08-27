import { describe, expect, it } from "vitest";
import type { User } from "../../drizzle/schema";
import { getSessionUserSyncPayload } from "./sdk";

const user: User = {
  id: 14,
  openId: "manus-account-open-id",
  name: "Prior Manus Name",
  email: "account@example.invalid",
  loginMethod: "manus",
  role: "user",
  accessStatus: "approved",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  lastSignedIn: new Date("2026-01-01T00:00:00Z"),
};

describe("Manus OAuth account synchronization", () => {
  it("uses the signed-in Manus registration name for the record-creator account", () => {
    const payload = getSessionUserSyncPayload(user, "Current Manus Registration Name", new Date("2026-08-27T00:00:00Z"));
    expect(payload).toMatchObject({ openId: user.openId, name: "Current Manus Registration Name", email: user.email, loginMethod: user.loginMethod });
  });

  it("preserves a previously synchronized Manus name when a session does not provide one", () => {
    const payload = getSessionUserSyncPayload(user, "", new Date("2026-08-27T00:00:00Z"));
    expect(payload.name).toBe("Prior Manus Name");
    expect(payload).not.toHaveProperty("role");
    expect(payload).not.toHaveProperty("accessStatus");
  });
});
