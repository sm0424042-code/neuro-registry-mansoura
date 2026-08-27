import { describe, expect, it } from "vitest";
import { filterAndSortCompletionTasks, getTaskNotificationLabel, getTaskStatusLabel } from "./CompletionTasks";

describe("completion-task labels", () => {
  it("uses clear controlled labels for task state", () => {
    expect(getTaskStatusLabel("assigned")).toBe("Assigned");
    expect(getTaskStatusLabel("reassigned")).toBe("Reassigned — accept again");
    expect(getTaskStatusLabel("completed")).toBe("Completed");
  });

  it("keeps administrator notification text generic and free from patient-record content", () => {
    for (const type of ["assigned", "accepted", "completed", "reassigned", "record_completion_changed"]) {
      const label = getTaskNotificationLabel(type);
      expect(label).toMatch(/record-completion (task|status)/i);
      expect(label).not.toMatch(/MUNR|research ID|diagnosis|cohort|patient name|email/i);
    }
  });

  it("filters task views by current state and sorts unresolved work ahead of completed work", () => {
    const tasks = [
      { id: 1, status: "completed", updatedAt: "2026-08-20T09:00:00.000Z" },
      { id: 2, status: "accepted", updatedAt: "2026-08-21T09:00:00.000Z" },
      { id: 3, status: "assigned", updatedAt: "2026-08-19T09:00:00.000Z" },
      { id: 4, status: "reassigned", updatedAt: "2026-08-22T09:00:00.000Z" },
    ];
    expect(filterAndSortCompletionTasks(tasks, "action_required", "attention_first").map(task => task.id)).toEqual([4, 3]);
    expect(filterAndSortCompletionTasks(tasks, "all", "attention_first").map(task => task.id)).toEqual([4, 3, 2, 1]);
    expect(filterAndSortCompletionTasks(tasks, "all", "updated_desc").map(task => task.id)).toEqual([4, 2, 1, 3]);
    expect(filterAndSortCompletionTasks(tasks, "completed", "updated_asc").map(task => task.id)).toEqual([1]);
  });
});
