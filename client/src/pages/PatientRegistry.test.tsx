import { describe, expect, it } from "vitest";
import { getInitialRegistryFilters, getRecordedByLabel } from "./PatientRegistry";

describe("PatientRegistry saved-record destination", () => {
  it("uses the saved research ID from the protected route query as the initial registry search", () => {
    expect(getInitialRegistryFilters("/registry?search=munr-00000000000001").search).toBe("MUNR-00000000000001");
    expect(getInitialRegistryFilters("/registry").search).toBe("");
  });

  it("uses an OAuth display name for Recorded by and never substitutes an email or identifier", () => {
    expect(getRecordedByLabel("Approved Researcher")).toBe("Approved Researcher");
    expect(getRecordedByLabel(undefined)).toBe("OAuth display name unavailable");
  });
});
