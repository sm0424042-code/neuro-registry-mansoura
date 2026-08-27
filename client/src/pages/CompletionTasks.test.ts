import { describe, expect, it } from "vitest";
import { getTaskNotificationLabel, getTaskStatusLabel } from "./CompletionTasks";

describe("completion-task labels", () => {
  it("uses clear controlled labels for task state", () => {
    expect(getTaskStatusLabel("assigned")).toBe("Assigned");
    expect(getTaskStatusLabel("reassigned")).toBe("Reassigned — accept again");
    expect(getTaskStatusLabel("completed")).toBe("Completed");
  });

  it("keeps administrator notification text generic and free from patient-record content", () => {
    for (const type of ["assigned", "accepted", "completed", "reassigned"]) {
      const label = getTaskNotificationLabel(type);
      expect(label).toMatch(/record-completion task/i);
      expect(label).not.toMatch(/MUNR|research ID|diagnosis|cohort|patient name|email/i);
    }
  });
});
