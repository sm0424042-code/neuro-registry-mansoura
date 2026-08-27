import { describe, expect, it } from "vitest";
import { createCompletionTaskCsv } from "./completionTaskExport";

describe("completion-task CSV export", () => {
  it("emits only controlled task status and UTC update columns", () => {
    const csv = createCompletionTaskCsv([
      { status: "assigned", updatedAt: "2026-08-27T09:15:00.000Z" },
      { status: "completed", updatedAt: "2026-08-27T11:30:00.000Z" },
    ]);
    expect(csv).toBe('"Task status","Last updated (UTC)"\r\n"Assigned","2026-08-27T09:15:00.000Z"\r\n"Completed","2026-08-27T11:30:00.000Z"');
    expect(csv).not.toMatch(/MUNR|research id|patient|record id|diagnosis|cohort|clinical|email|assigned to/i);
  });

  it("uses a safe fallback for an unexpected task state", () => {
    const csv = createCompletionTaskCsv([{ status: "=unsafe", updatedAt: "2026-08-27T09:15:00.000Z" }]);
    expect(csv).toContain('"Unknown"');
    expect(csv).not.toContain("=unsafe");
  });
});
