import { describe, expect, it } from "vitest";
import { getInitialRegistryFilters } from "./PatientRegistry";

describe("PatientRegistry saved-record destination", () => {
  it("uses the saved research ID from the protected route query as the initial registry search", () => {
    expect(getInitialRegistryFilters("/registry?search=munr-stroke26").search).toBe("MUNR-STROKE26");
    expect(getInitialRegistryFilters("/registry").search).toBe("");
  });
});
