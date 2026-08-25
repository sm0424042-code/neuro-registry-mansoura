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
- [x] Save a new checkpoint after the cohort and radiology update is verified.
- [x] Verify that the owner administrator can approve pending new users manually, while automatic approval remains disabled. Covered by the explicit admin procedure test and the users.accessStatus pending default.

- [x] Add structured Laboratory Investigations for thyroid function, uric acid, and other research-relevant laboratory panels.
- [x] Add structured Additional Neurological Investigations for EMG/NCS, CSF analysis, fundus examination, and other tests.
- [x] Add lower-motor-neuron applicability and investigation status without forcing it into the cohort taxonomy.
- [x] Preserve the seven approved neurological cohorts while keeping the registry free of patient names and phone numbers.
- [x] Redesign the English interface around the Neurology research workflow and investigation sections.
- [x] Update de-identified export and add laboratory/neurological investigation tests.
- [x] Re-run tests, visual QA, and save a new checkpoint.

- [x] Replace the current cohort taxonomy with Stroke, Multiple Sclerosis (MS), Abnormal Movements, Guillain–Barré Syndrome (GBS), Myasthenia Gravis (MG), Myelopathy, and Neuro-ophthalmology.
- [x] Add cohort-specific clinical fields and English labels for MS, Myelopathy, and Neuro-ophthalmology while preserving existing research safeguards.
- [x] Update cohort filters, dashboard composition, export mapping, and validation tests for the seven requested cohorts.
- [x] Re-run tests, visual QA, and save a new checkpoint after the taxonomy update.

- [x] Add a structured Patient Follow-up section linked to Research ID, including visit type, follow-up status, outcome, assessment summary, and next follow-up plan.
- [x] Include follow-up information in validation, audit history, and de-identified export without direct identifiers.
- [x] Add tests and visual QA for the Patient Follow-up section before the next checkpoint.

- [x] Add secure Research ID-linked upload records for radiology images, reports, and other approved research files.
- [x] Store file bytes through the project storage service and keep only metadata and storage references in the database.
- [x] Add protected upload/list/download procedures with file-type, size, and filename privacy validation.
- [x] Add the upload interface to the Neurology patient record workflow without exposing files in CSV exports.
- [x] Add tests for upload authorization, allowed file types, privacy-safe filenames, and metadata export exclusion.
- [x] Re-run tests, visual QA, and save a new checkpoint.

- [x] Add explicit CSV export tests for laboratory investigations, neurological investigations, and follow-up visits, documenting intended inclusion of research-safe summaries.
- [x] Add an export test proving researchFiles and file metadata are excluded from de-identified CSV rows.
- [x] Add audit-log coverage for follow-up changes and verify follow-up edits produce an audit event.
- [x] Add router tests for upload authorization, allowed and rejected MIME types, file-size limits, and protected list/download access.

- [x] Add an integration-style test proving a follow-up update writes an audit-log event.
- [x] Add router tests for rejected upload MIME types and oversized files.
- [x] Add protected file-list and file-download access coverage, or implement a protected download procedure where direct public URLs are not appropriate.
- [x] Save a new checkpoint after the latest export, audit, upload, and follow-up changes.
- [x] Add an isolated database-adapter integration test that exercises a follow-up update and asserts an audit-log insert payload.
- [x] Add router-level upload rejection tests for unsupported MIME type and oversized payload, not only schema-level tests.

- [x] Rename the platform and all English export/administration labels from Egypt Neuro Registry to Mansoura University Neurology Research Registry.
- [x] Add CIDP as a cohort with its dedicated clinical fields and protocol investigation recommendations.
- [x] Remove the intersex option from patient sex fields and validation.
- [x] Add Stroke laboratory prompts for HbA1c, uric acid, and lipid profile.
- [x] Replace Stroke vascular territory options with ACA, MCA complete, MCA incomplete, PCA, and vertebrobasilar.
- [x] Add MS disease-modifying therapy examples and the MS Functional Composite (MSFC) disability scale.
- [x] Add protocol investigation prompts appropriate to every cohort.
- [x] Add record-completeness status, missing-items indicators, and a responsible user assignment for follow-up completion.
- [x] Display Abdelrahman Ibrahim Rashad as the registry access approver while preserving owner-based administrator authorization.
- [x] Redesign the overview to surface neurology-specific cohort, investigation, and record-completion indicators.
- [x] Update tests and run visual QA for the Mansoura University update.
- [x] Save a checkpoint for the Mansoura University update.

- [x] Add overview investigation-coverage metrics for protocol checklists and radiological, laboratory, and neurological investigation completion.
- [x] Add tests for the overview investigation-coverage data contract.
- [x] Run visual QA of the updated overview.

- [x] Perform authenticated visual QA of the Mansoura University overview, registry, record editor, and access pages.
- [x] Verify investigation-coverage panels render clearly on the authenticated overview at desktop and mobile widths.
- [x] Save the final checkpoint only after authenticated visual QA is complete.

- [ ] Complete browser-session authenticated QA of the overview, registry, record editor, and access management screens.
- [ ] Capture authenticated desktop and mobile visual evidence for the investigation-coverage panel and protected workflows.
- [ ] Save a post-QA checkpoint after independently evidenced authenticated verification.

- [x] Make the Mansoura University neurology identity and eight cohorts unmistakable on the overview.
- [x] Add an at-a-glance clinical workflow panel showing Stroke, MS, CIDP, investigations, follow-up, and record-completion actions.
- [x] Make cohort-specific clinical protocol fields more prominent and easier to scan in the new-record flow.
- [x] Refresh the visible desktop and mobile preview and verify the user-facing redesign in the production build.
- [ ] Save a user-facing redesign checkpoint.
