export const COMPLETE_RECORD_THRESHOLD_PERCENT = 85;

type CompletionInput = {
  researchId?: unknown;
  primaryDiagnosis?: unknown;
  ageAtEnrollment?: unknown;
  sex?: unknown;
  consentStatus?: unknown;
  enrollmentStatus?: unknown;
  clinicalStatus?: unknown;
  clinicalData?: Record<string, unknown> | null;
  protocolInvestigations?: Array<{ status?: unknown }> | null;
  missingItems?: unknown[] | null;
};

const unrecordedValues = new Set(["", "unknown", "not_recorded", "not_done", "not_assessed", "pending"]);
const ignoredClinicalKeys = new Set(["cohort", "evaluationItems", "additionalResearchFocus", "additionalResearchInformation"]);

function isRecorded(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;
  if (typeof value !== "string") return false;
  return !unrecordedValues.has(value.trim().toLowerCase());
}

export function getResearchRecordCompleteness(input: CompletionInput) {
  const coreValues = [input.researchId, input.primaryDiagnosis, input.ageAtEnrollment, input.sex, input.consentStatus, input.enrollmentStatus, input.clinicalStatus];
  const clinicalEntries = Object.entries(input.clinicalData ?? {}).filter(([key]) => !ignoredClinicalKeys.has(key));
  const clinicalValues = clinicalEntries.filter(([key]) => key !== "timed25FootWalkSeconds" && key !== "nineHolePegTestSeconds" && key !== "pasat3Score").map(([, value]) => value);
  const msfcIsAssessed = input.clinicalData?.msfcAssessed === "yes";
  if (msfcIsAssessed) clinicalValues.push(input.clinicalData?.timed25FootWalkSeconds, input.clinicalData?.nineHolePegTestSeconds, input.clinicalData?.pasat3Score);
  const evaluations = Array.isArray(input.clinicalData?.evaluationItems) ? input.clinicalData.evaluationItems : [];
  const evaluationValues = evaluations.map(item => typeof item === "object" && item !== null ? (item as { status?: unknown }).status : undefined);
  const protocolStatuses = (input.protocolInvestigations ?? []).map(item => item?.status);
  const values = [...coreValues, ...clinicalValues, ...evaluationValues, ...protocolStatuses];
  const complete = values.filter(value => value === "completed" || value === "not_indicated" || isRecorded(value)).length;
  const total = values.length;
  return { complete, total, percentage: total === 0 ? 0 : Math.round((complete / total) * 100), unresolvedMissingItems: input.missingItems?.length ?? 0 };
}

export function getCompleteRecordThresholdError(input: CompletionInput & { dataQualityStatus?: string; completenessStatus?: string }) {
  const isMarkedComplete = input.dataQualityStatus === "complete" || input.completenessStatus === "complete";
  if (!isMarkedComplete) return null;
  const completeness = getResearchRecordCompleteness(input);
  if (completeness.unresolvedMissingItems > 0) return "A complete record cannot retain items still required. Save it as a draft or resolve the listed items.";
  if (completeness.percentage < COMPLETE_RECORD_THRESHOLD_PERCENT) return `A complete record requires at least ${COMPLETE_RECORD_THRESHOLD_PERCENT}% of assessed research fields. This record is currently ${completeness.percentage}%. Save it as a draft to continue later.`;
  return null;
}
