# Visual QA Notes

## Verified in the current session

The protected `/records/new` route was opened in the live sandbox browser. It displayed the **Authorised access only** gate and did not expose registry data, confirming that a missing session cookie does not reveal protected research records.

The same protected route now visibly displays a **Latest clinical workflow added** release summary on desktop and mobile. The summary names the new Stroke, MS, CIDP/neuropathy, and Neuro-ophthalmology pathways while exposing no patient-specific data. The mobile capture stacked the secure sign-in card, the release summary, and the protected editor skeleton without horizontal overflow.

The public desktop access gate was rechecked after the pre-immune-therapy update. Its MS release card now explicitly lists **infection-exclusion review**, while the page still displays only non-sensitive release information and retains the authorised-access gate.

The public `/workflow-preview` demonstration was opened in the live browser. It visibly lists the requested Stroke complication, MS infection-exclusion review, CIDP MADSAM and vasculitic-neuropathy pathway, and NMOSD/MOGAD/GCA sections, alongside the shared history, examination, discharge-treatment, completion, file, and follow-up workflow. Its page text confirms that it contains no patient records, sample cases, identities, contact details, or live registry data.

After the workflow demonstration call-to-action was corrected, the live browser exposed one **Open secure registry** link control rather than nested interactive controls. The public page remained available without sign-in and continued to show no registry data.

The public workflow demonstration was also captured at 390×844. Its privacy notice, workflow steps, all four cohort pathway cards, shared record sections, infection-exclusion review, and single secure-registry link stacked legibly without visible horizontal overflow.

After the requested pre-immunotherapy investigation expansion, the public workflow page was rechecked in the live browser. The MS pathway now visibly lists **Chest imaging and tuberculin / IGRA TB screen** and **Varicella immunity (VZV immunoglobulin / serology)**. The safety panel repeats the three investigations as documented protocol items with a status and research-safe note, while the page remains free of patient data.

The protected Overview hero was redesigned and captured at 1280×720 and 390×844. On desktop, the large brain image occupies the right half of the hero with an explicit **Neuroimaging context** label and a non-patient-scan notice. On mobile, the visual remains visible below the registry introduction, with the call-to-action buttons, privacy text, and image label stacking without overflow.

The Overview was then refined to a premium black-charcoal treatment. The final desktop capture confirms a dark high-contrast brain image against a black hero, with legible light copy, pale-teal primary action, restrained charcoal secondary action, and the explicit non-patient neuroimaging label retained. An initial generated visual placeholder was not used in the final rendering; the established non-patient image now receives the controlled black high-contrast treatment.

At 390×844, the final black Overview stacks the copy and dark brain visual cleanly. The image remains recognizable, the pale-teal primary action and white text retain contrast, and the privacy-safe image label remains readable without horizontal overflow.

Following the user's selection of the neural-network direction, the final desktop Overview was verified with a dark privacy-safe brain image plus a restrained teal node-and-connection overlay. The neural network is visibly concentrated over the brain rather than the copy column, preserving a clear editorial hierarchy and the black premium treatment.

At 390×844, the selected neural-network visual stays visible beneath the Overview copy. The node-and-connection overlay, brain detail, action controls, and privacy label remain readable without horizontal overflow.

The public workflow demonstration was updated and verified at desktop and mobile sizes for the explicit cohort evaluation update. It now shows all eight disease cohorts with itemized evaluation sections: Stroke NIHSS/mRS; MS EDSS/MSFC; Abnormal Movements phenomenology/severity; GBS disability/MRC/respiratory status; MG MGFA/MG-ADL/QMG; Myelopathy functional/gait/UMN-LMN review; Neuro-ophthalmology visual acuity/fields/OCT; and CIDP INCAT/ONLS/MRC/EMG-NCS/vasculitic review. The page remains explicitly non-patient and free of live registry data, and the mobile version stacks all cards without horizontal overflow.

The project preview renderer for `/records/new` visibly rendered the Stroke-specific **Stroke evaluation items** card underneath the standard Stroke fields. It contains five separately labelled controls—NIHSS, mRS, TOAST aetiology, dysphagia screen, and functional outcome—each with a status selector and optional research-safe recorded-value field. This renderer capture is layout evidence; interactive browser-session verification remains deferred.

After the disease-exclusive refinement, the Stroke editor renderer was recaptured. The card now uses exclusively prefixed Stroke items—Stroke NIHSS, Stroke modified Rankin Scale, Stroke TOAST aetiology, Stroke dysphagia screen, and Stroke functional outcome—so no generic scale labels appear as a shared cross-cohort checklist.

The public workflow desktop view now explicitly states: **“There is no standard evaluation checklist shared across diseases.”** The message is fully visible next to the research-safe record flow and reinforces that the displayed eight-cohort pathways are disease-specific.

The public workflow was rechecked after the CIDP variant update. The CIDP card visibly lists the explicit variants—typical, MADSAM, distal, focal, motor, and sensory—and separately identifies CIDP variant-pattern evaluation with the CIDP disability and strength assessments. The page remains a data-free demonstration.

The restarted CIDP-selected editor preview at `/records/new?cohort=cidp` visibly renders the **CIDP variant** selector alongside diagnostic pathway, EMG/NCS evidence, and CSF protein status. The CIDP evaluation card directly beneath it begins with **CIDP variant pattern**, followed by CIDP INCAT/ONLS, MRC sum score, sensory ataxia, EMG/NCS evidence, and vasculitic features. This confirms the requested field and disease-specific variant evaluation in the editor renderer.

The restarted Access Management view visibly renders the named manual approver, the manual approve/suspend table action, and the three-stage secure sign-in, applicant-details, and manual-decision flow. The governance reminder explicitly excludes passwords, national ID numbers, patient identifiers, and contact details from approval notes.

The protected `/messages` route was captured through the project renderer, but the capture settled on the authenticated dashboard loading shell rather than reliably proving the final Messages workspace. A normal browser session shows the authorised-access gate because it has no approved OAuth session. No artificial colleague or message was created merely for visual proof. Therefore recipient selection, sending, polling, final empty-recipient rendering, and final-screen layout remain unverified in a real approved-user session.

The project preview renderer captured desktop layouts for `/records/new` and `/`, visibly showing the active **Stroke** pathway, the history / examination / discharge-treatment card, the brain-imaging overview visual, and the clinical workflow board. These renderer captures are useful layout evidence but are not treated as a replacement for a real browser-session authentication check.

The code-level update was validated with TypeScript, Vitest, and a production build. The unprotected server startup and the protected access gate both loaded after the latest clinical workflow changes.

## Deferred verification

The sandbox browser does not hold an approved OAuth session, and the user explicitly asked to skip the sign-in step. A later approved browser-session review remains required for interactive checks of all cohort selectors, especially MS and CIDP-specific editor controls. The renderer captures and contract tests evidence implementation and layout only; they do not constitute authenticated browser verification.
