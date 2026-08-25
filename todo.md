# Project TODO

- [x] Define a pseudonymised patient data model using a non-identifying Research ID and no direct identifiers.
- [x] Add consent and study-enrolment status fields with controlled values.
- [x] Add cohort-specific clinical data for Stroke, Myasthenia Gravis, Guillain–Barré Syndrome, and Myopathy.
- [x] Restrict registry functions to authenticated users and separate administrator-only actions.
- [x] Create an immutable-style audit trail for patient record creation and modification events.
- [x] Build a secure English-language registry dashboard with cohort totals and clinical status summaries.
- [x] Build a searchable, filterable patient registry with cohort and core-variable filters.
- [x] Build a structured patient record form with cohort-specific sections and validation.
- [x] Create a de-identified CSV research export that excludes direct and quasi-identifying fields.
- [x] Add user-access management controls for administrators.
- [x] Add tests for validation, authorization, de-identification, and registry query-filter inputs; database integration tests are deferred because the project has no isolated non-production test database.
- [x] Verify desktop and mobile UI rendering, run tests, and prepare a delivery checkpoint.

- [x] Replace the original cohort list with Stroke, Neurovascular Compression Syndrome, Vessel Disease, Epilepsy, Neurodegenerative Disease, and Abnormal Movement.
- [x] Define the additional research information shown for each Research ID without collecting direct identifiers.
- [x] Update cohort-specific clinical fields and validation for the six requested categories.
- [x] Update dashboard totals, registry filters, and export labels for the six requested categories.
- [x] Add tests covering the new cohort values and Research ID privacy rules.
- [x] Re-run visual verification and save an updated checkpoint.
- [x] Add a structured English Radiological Investigations section with modality, body region, key finding, lesion status, and non-identifying report reference.
- [x] Include radiological investigation data in validation and de-identified research export rules.
- [x] Add tests for radiological investigation validation and privacy-safe export.
- [x] Add a dedicated Research ID details surface showing linked non-identifying registry metadata and privacy policy.
- [x] Add explicit validation tests for all six requested cohort values and direct Research ID privacy-format tests.
- [x] Perform authenticated visual QA for the updated dashboard, registry, and record editor pages.
- [ ] Save a new checkpoint after the cohort and radiology update is verified.
- [x] Verify that the owner administrator can approve pending new users manually, while automatic approval remains disabled. Covered by the explicit admin procedure test and the users.accessStatus pending default.
