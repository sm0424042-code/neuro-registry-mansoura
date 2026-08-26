import { describe, expect, it } from "vitest";
import { canClearAllSavedItems } from "./savedItemsAccess";

describe("canClearAllSavedItems", () => {
  it("permits only approved administrators", () => {
    expect(canClearAllSavedItems({ role: "admin", accessStatus: "approved" })).toBe(true);
  });

  it("rejects missing, non-administrator, pending, and suspended sessions", () => {
    expect(canClearAllSavedItems(undefined)).toBe(false);
    expect(canClearAllSavedItems({ role: "user", accessStatus: "approved" })).toBe(false);
    expect(canClearAllSavedItems({ role: "admin", accessStatus: "pending" })).toBe(false);
    expect(canClearAllSavedItems({ role: "admin", accessStatus: "suspended" })).toBe(false);
  });
});
