import { describe, expect, it } from "vitest";
import { nextVisibleSavedItemCount, visibleSavedItems } from "./savedItemsPagination";

describe("saved item pagination", () => {
  it("reveals one local page at a time and caps the count at the available items", () => {
    expect(nextVisibleSavedItemCount(6, 14)).toBe(12);
    expect(nextVisibleSavedItemCount(12, 14)).toBe(14);
    expect(nextVisibleSavedItemCount(14, 14)).toBe(14);
  });

  it("returns only the requested progressive window", () => {
    expect(visibleSavedItems(["a", "b", "c"], 2)).toEqual(["a", "b"]);
    expect(visibleSavedItems(["a", "b", "c"], 10)).toEqual(["a", "b", "c"]);
  });
});
