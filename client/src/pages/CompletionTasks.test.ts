import { describe, expect, it } from "vitest";
import { filterAndSortCompletionTasks, getCompletionTaskPage, getCompletionTaskPagination, getNextTaskSearchSuggestionIndex, getTaskExportInput, getTaskLoadingMode, getTaskNotificationLabel, getTaskSearchSuggestions, getTaskSearchValidation, getTaskStatusLabel } from "./CompletionTasks";

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

  it("paginates already-filtered task results into a bounded accessible page window", () => {
    const tasks = Array.from({ length: 23 }, (_, index) => ({ id: index + 1 }));
    expect(getCompletionTaskPage(tasks, 1)).toMatchObject({ page: 1, pageCount: 3, totalItems: 23, firstItem: 1, lastItem: 10 });
    expect(getCompletionTaskPage(tasks, 2).items.map(task => task.id)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(getCompletionTaskPage(tasks, 9)).toMatchObject({ page: 3, firstItem: 21, lastItem: 23 });
    expect(getCompletionTaskPage([], 1)).toMatchObject({ page: 1, pageCount: 0, totalItems: 0, firstItem: 0, lastItem: 0, items: [] });
    expect(getCompletionTaskPagination(23, 9)).toMatchObject({ page: 3, pageCount: 3, firstItem: 21, lastItem: 23 });
  });

  it("shows a skeleton only during the initial load or a retained-page transition", () => {
    expect(getTaskLoadingMode(true, true, false)).toBe("initial");
    expect(getTaskLoadingMode(false, true, true)).toBe("transition");
    expect(getTaskLoadingMode(false, false, true)).toBe("idle");
    expect(getTaskLoadingMode(false, true, false)).toBe("idle");
  });

  it("accepts only operational status terms or valid UTC dates for task search", () => {
    expect(getTaskSearchValidation(" Accepted ")).toEqual({ normalized: "accepted", error: null });
    expect(getTaskSearchValidation("2026-08-27")).toEqual({ normalized: "2026-08-27", error: null });
    expect(getTaskSearchValidation("2026-02-30").error).toMatch(/valid UTC date/i);
    expect(getTaskSearchValidation("member name").error).toMatch(/task status/i);
    expect(getTaskSearchValidation("MUNR-0000000000000000000000001").error).toMatch(/task status/i);
  });

  it("offers only fixed operational suggestions and a UTC date-format helper", () => {
    const suggestions = getTaskSearchSuggestions("", new Date("2026-08-27T10:30:00.000Z"));
    expect(suggestions.map(suggestion => suggestion.value)).toEqual(["assigned", "reassigned", "accepted", "completed", "awaiting acceptance", "2026-08-27"]);
    expect(getTaskSearchSuggestions("acc", new Date("2026-08-27T10:30:00.000Z")).map(suggestion => suggestion.value)).toEqual(["accepted", "awaiting acceptance"]);
    expect(getTaskSearchSuggestions("person", new Date("2026-08-27T10:30:00.000Z"))).toEqual([]);
    expect(JSON.stringify(suggestions)).not.toMatch(/MUNR|research|record|patient|clinical|email|assigned to/i);
  });

  it("cycles safely through auto-complete options using arrow keys", () => {
    expect(getNextTaskSearchSuggestionIndex(-1, "ArrowDown", 3)).toBe(0);
    expect(getNextTaskSearchSuggestionIndex(2, "ArrowDown", 3)).toBe(0);
    expect(getNextTaskSearchSuggestionIndex(0, "ArrowUp", 3)).toBe(2);
    expect(getNextTaskSearchSuggestionIndex(-1, "ArrowDown", 0)).toBe(-1);
  });

  it("sends only the current controlled status, search, and sort options to the CSV export", () => {
    expect(getTaskExportInput("all", "attention_first")).toEqual({ status: undefined, search: undefined, sort: "attention_first" });
    expect(getTaskExportInput("accepted", "updated_desc", "accepted")).toEqual({ status: "accepted", search: "accepted", sort: "updated_desc" });
  });
});
