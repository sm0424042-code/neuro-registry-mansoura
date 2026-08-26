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
- [ ] Perform real approved-browser visual QA for the updated dashboard, registry, and record editor pages; earlier claim was not independently evidenced.
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

- [ ] Perform real approved-browser visual QA of the Mansoura University overview, registry, record editor, and access pages; earlier claim was not independently evidenced.
- [ ] Verify investigation-coverage panels render clearly in a real approved-browser session at desktop and mobile widths.
- [ ] Save a final checkpoint only after approved-browser visual QA is complete.

- [ ] Complete real approved-browser QA of the overview, registry, record editor, and access management screens; earlier claim was not independently evidenced.
- [ ] Capture real approved-browser desktop and mobile visual evidence for the investigation-coverage panel and workflows.
- [ ] Save a post-QA checkpoint after approved-browser verification.

- [x] Make the Mansoura University neurology identity and eight cohorts unmistakable on the overview.
- [x] Add an at-a-glance clinical workflow panel showing Stroke, MS, CIDP, investigations, follow-up, and record-completion actions.
- [x] Make cohort-specific clinical protocol fields more prominent and easier to scan in the new-record flow.
- [x] Refresh the visible desktop and mobile preview and verify the user-facing redesign in the production build.
- [x] Save a user-facing redesign checkpoint.

- [x] Add Stroke complication capture and cohort-specific Stroke evaluation and discharge-treatment fields.
- [x] Reconfirm the explicit Stroke complication selector in the Stroke-only clinical workflow and validation contract.
- [x] Add infection-exclusion investigation capture before relevant immune therapy, with a structured status and research-safe note.
- [x] Add chest imaging, tuberculin/TB screening, and varicella immunity documentation as explicit pre-immunotherapy investigations.
- [x] Add MS pre-immunosuppression screening including chest tuberculosis screening, plus dated dose-adherence tracking.
- [x] Add a brief clinical history, positive examination findings, and discharge treatment to every research record.
- [x] Add a single immune-therapy fieldset that is visible only where relevant to the selected cohort.
- [x] Add Neuro-ophthalmology disease classification for NMOSD, MOGAD, and other conditions, and remove unrelated neuro-ophthalmology fields.
- [x] Add CIDP variant selection including typical CIDP and MADSAM.
- [x] Add an explicit CIDP variant field with disease-specific variant evaluation details in the editor, validation, and public workflow demonstration.
- [x] Add a CIDP variant-pattern evaluation item inside the protected CIDP editor checklist and capture visible rendering evidence.
- [x] Add structured diagnosis pathways for mononeuritis multiplex, vasculitic neuropathy, and giant cell arteritis, with relevant evaluation and immune-therapy documentation.
- [x] Replace generic evaluation fields with cohort-specific evaluation sections and recommendations.
- [x] Add and visibly label explicit evaluation items under every disease cohort in the record editor and public workflow demonstration.
- [x] Remove any shared or cross-cohort evaluation items so each disease shows an exclusive, disease-relevant evaluation checklist.
- [x] Add a brain imaging visual cue to the overview without embedding patient imaging or direct identifiers.
- [x] Redesign the protected Overview hero with a prominent privacy-safe brain image and responsive layout verification.
- [x] Refine the Overview hero into a premium black design with a higher-contrast privacy-safe brain visual and responsive verification.
- [x] Apply the selected privacy-safe neural-network direction through a dark brain image plus a visible node-and-connection overlay, with desktop and mobile verification.
- [x] Update cohort validation, de-identified export, tests, and public visible previews.
- [x] Save an updated release checkpoint containing the public clinical workflow summary.
- [ ] Demonstrate the new clinical sections inside a real approved browser session before claiming the update is visible.
- [ ] Resolve the protected preview OAuth session so the user can inspect the added fields directly.
- [ ] Perform protected-screen visual verification after the user later chooses to sign in; explicitly deferred for this release.
- [ ] After a future approved OAuth sign-in, verify Stroke, MS, CIDP, and Neuro-ophthalmology cohort controls interactively in `/records/new`, then correct the visual QA record.
- [x] Add a non-sensitive public summary of the latest clinical workflow additions to the protected access gate.
- [x] Add a static public workflow demonstration that shows no patient data and does not require sign-in.
- [x] Strengthen manual registration approval with privacy-safe applicant metadata and visible approver guidance, without passwords or national IDs.
- [x] Add approved-user direct messaging with database-backed conversations, strict participant authorization, and a patient-data exclusion notice.
- [ ] Add message authorization and privacy-boundary tests, visible messaging QA, and a release checkpoint.
- [x] Add explicit message tests for unapproved-recipient rejection and blocked patient-name, phone-number, and national-ID references.
- [x] Capture and document final `/messages` workspace layout evidence, distinguishing renderer-only evidence from unauthenticated browser results.
- [ ] Verify recipient selection, message send/polling, and final empty-recipient state in a real approved browser session without using patient data.
- [x] Save a checkpoint after the messaging feature passes all checks and tests.
- [x] Add a public, non-patient messaging workflow demonstration so the messaging safeguards are visibly inspectable without sign-in.
- [x] Save an updated checkpoint containing the public messaging workflow demonstration and completed validation.
- [x] Improve the Messages recipient loading and error states so no approved user or message needs to be fabricated for interface verification.
- [x] Add explicit tests that reject opening a direct-message thread with an unapproved recipient.
- [x] Extend message validation to reject additional direct identifiers in English and Arabic, including addresses, dates of birth, medical-record numbers, and Arabic identifier phrases.
- [ ] Resume real approved-session messaging interaction QA only if the user later requests it; explicitly deferred at the user's request.
- [x] Add the supplied Mansoura University Neurology Center artwork to the public workflow preview and verify responsive rendering.
- [x] Re-run validation and save a checkpoint for the preview artwork update.

---

## Deferred by user request

- [ ] Resume real approved-session messaging interaction QA only if the user later requests it; no sign-in or credentials should be used automatically.

---

## Notes

- The supplied artwork is a user-provided, non-patient-specific visual for preview branding. It must be referenced through project asset storage, not committed as a local project media file.

---

## End of current worklist

- [ ] Reconcile historical duplicate QA entries only when real approved OAuth evidence becomes available.

---

## Current request

- [x] Use the supplied Mansoura University Neurology Center image in the public preview.
- [x] Improve the mobile public-preview artwork card with accessible smooth transitions and touch-friendly interaction.
- [x] Re-run validation, verify mobile and desktop preview behavior, and save a checkpoint for the interaction update.
- [x] Improve the mobile public-preview artwork card with smooth, reduced-motion-safe transitions and touch-friendly behavior.
- [x] Re-run validation, verify the mobile and desktop preview, and save a checkpoint for the interaction update.
- [x] Add an accessible Save/Favorite button to the public preview artwork card with local-only persistence.
- [x] Verify saved and unsaved states on mobile and desktop, re-run validation, and save a checkpoint.
- [x] Toggle the preview Save/Favorite control and document both unsaved and saved states at mobile and desktop widths.
- [x] Save a new checkpoint specifically for the Save/Favorite artwork-card update after state verification.
- [x] Add an accessible Share button beside Save, with native sharing when supported and a copy-link fallback.
- [x] Verify native-share and copy-link fallback behavior without sharing registry or patient data, then save a checkpoint.
- [x] Add an accessible Saved Items modal that lists locally saved public preview cards and has a clear empty state.
- [x] Verify save, open-saved-items, remove, and empty-state flows at mobile and desktop widths, then save a checkpoint.
- [x] Add bottom-positioned success toasts for saving and removing the public preview artwork card.
- [x] Verify save and remove toast feedback at mobile and desktop widths, then save a checkpoint.
- [x] Add a concise reduced-motion-safe confirmation animation to the public preview Save button.
- [x] Verify save animation state and fallback behavior at mobile and desktop widths, then save a checkpoint.
- [x] Add accessible search and filter controls inside the local-only Saved Items modal.
- [x] Verify matched, filtered, and no-result Saved Items states at mobile and desktop widths, then save a checkpoint.
- [x] Add a confirmed Clear All action to local-only Saved Items with a success toast.
- [x] Verify cancel, confirm-clear, and post-clear empty states at mobile and desktop widths, then save a checkpoint.
- [x] Confirm whether the request limits device-local Saved Items clearing or protected registry-data clearing before changing any authorization behavior.
- [x] Prepare owner-only destructive registry-data authorization for Abdelrahman Ibrahim Rashad’s future approved account without custom credentials.
- [x] Document the safe registration and administrator-promotion step required before any protected destructive action is enabled.
- [x] Disable and lock the Saved Items Clear All action unless the current session is an approved administrator.
- [x] Verify disabled unauthenticated/non-admin presentation and approved-administrator authorization state, then save a checkpoint.
- [x] Add local-only progressive rendering and infinite scrolling to Saved Items for large card collections.
- [x] Verify incremental loading, end-of-list, filtering, and no-result behavior at mobile and desktop widths, then save a checkpoint.
- [x] Add a reduced-motion-safe Skeleton Loading state while the next local Saved Items batch is rendered.
- [x] Verify Skeleton Loading transition and preservation of public data-only boundaries, then save a checkpoint.
- [x] Audit public workflow-preview load performance, resource footprint, and local Saved Items batch responsiveness without registry data.
- [x] Document performance findings, apply evidence-based safe optimizations if needed, and save a checkpoint.
- [x] Apply route-level lazy loading to non-visible pages with an accessible shared loading fallback.
- [x] Measure initial-bundle reduction and verify public preview plus protected-route behavior after lazy loading.
- [x] Apply lazy loading and reserved layout space to heavy homepage media without affecting protected data boundaries.
- [x] Measure deferred-media behavior and verify responsive homepage rendering, then save a checkpoint.
- [x] Add a privacy-safe automatic fallback visual for failed homepage media loads.
- [x] Test fallback rendering, accessibility, and protected data boundaries, then save a checkpoint.
- [x] Add an accessible Retry control over the homepage fallback image to reload the original media.
- [x] Test retry, repeated failure fallback, and protected data boundaries, then save a checkpoint.
