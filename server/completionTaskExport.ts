export type CompletionTaskExportRow = { status: string; updatedAt: Date | string };

const csvHeaders = ["Task status", "Last updated (UTC)"] as const;

function escapeCsvCell(value: string) {
  const formulaSafe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${formulaSafe.replace(/"/g, '""')}"`;
}

export function createCompletionTaskCsv(rows: CompletionTaskExportRow[]) {
  return [csvHeaders.map(escapeCsvCell).join(","), ...rows.map(row => [getCompletionTaskExportStatus(row.status), new Date(row.updatedAt).toISOString()].map(escapeCsvCell).join(","))].join("\r\n");
}

function getCompletionTaskExportStatus(status: string) {
  return ({ assigned: "Assigned", reassigned: "Reassigned — accept again", accepted: "Accepted", completed: "Completed" } as Record<string, string>)[status] ?? "Unknown";
}
