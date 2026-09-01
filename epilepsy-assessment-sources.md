# Epilepsy assessment source notes

These notes support controlled research-field design only; they are not treatment guidance or a diagnostic protocol.

## Sources reviewed

1. International League Against Epilepsy (ILAE), **Updated classification of epileptic seizures (2025)**: https://www.ilae.org/updated-classification-epileptic-seizures-2025
   - The 2025 operational classification retains four main seizure classes: focal, generalized, unknown whether focal or generalized, and unclassified.
   - The page describes a distinction between classifiers and descriptors and emphasizes consciousness and observable manifestations as classification concepts.
   - Registry mapping limitation: the form should use a concise controlled seizure-class field and optional structured descriptors, not reproduce the full taxonomy or infer a diagnosis.

2. NICE guideline NG217, **Epilepsies in children, young people and adults**: https://www.nice.org.uk/guidance/ng217
   - The guideline covers diagnosis and assessment, treatment safety and monitoring, prolonged/cluster seizures, comorbidities, epilepsy-related death risk, tertiary referral, and service provision.
   - Registry mapping limitation: fields should capture whether key assessments were performed and their research-safe status, not prescribe care or store identifying narratives.

## Proposed controlled research fields

- seizureClass: focal, generalized, unknown_focal_or_generalized, unclassified, or unknown
- epilepsyType: focal_epilepsy, generalized_epilepsy, combined_generalized_and_focal, unknown, or unclassified
- syndromeClassification: a limited controlled research label with unknown/unclassified options
- seizureFrequencyCategory: seizure-free, less_than_monthly, monthly_to_weekly, more_than_weekly, daily_or_near_daily, unknown
- lastSeizureInterval: never_recorded, less_than_24_hours, 1_to_7_days, 8_to_30_days, 1_to_6_months, more_than_6_months, unknown
- statusEpilepticusHistory: none, remote, recent, current_or_index_event, unknown
- clusterOrProlongedSeizures: none, documented, suspected, unknown
- eegAssessment: routine_eeg, sleep_or_sleep_deprived_eeg, prolonged_video_eeg, ambulatory_eeg, not_done, unknown
- neuroimagingAssessment: mri_epilepsy_protocol, other_mri, ct, no_relevant_imaging, unknown
- drugResistantEpilepsyStatus: not_applicable, not_yet_assessed, unlikely, suspected, confirmed, unknown
- antiseizureMedicationCount: none, one, two, three_or_more, unknown
- treatmentResponse: seizure_free, improved, unchanged, worsened, intolerant_or_adverse_effects, unknown
- safetyAndComorbidityScreening: completed, partially_completed, not_done, not_applicable, unknown
- epilepsyEvaluation: history_and_semiology, eeg_and_mri, prolonged_video_eeg, drug_resistance_review, surgery_or_tertiary_review, comprehensive_follow_up, unknown

All fields must remain cohort-specific, controlled, pseudonymised, and excluded from any output that could reveal direct identifiers. Clinical acceptance and final field wording require review by a qualified epilepsy clinician/research lead.
