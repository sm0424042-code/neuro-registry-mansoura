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

The normal sandbox browser shows the authorised-access gate at `/messages` because it has no approved OAuth session. The project renderer now visibly captures the protected Messages workspace layout: the approved-colleagues column gives an explicit **Checking approved colleagues…** loading status instead of unexplained placeholders; the empty conversation panel, disabled composer, and identifier-exclusion warning are visible. This is renderer-level layout evidence only. No artificial colleague or message was created, and recipient selection, sending, polling, and final empty-recipient rendering remain unverified in a real approved-user session.

The public `/workflow-preview` page was opened in the live browser after the messaging update. It visibly presents a **Direct work conversations, separate from records** panel and a **How the protected chat works** panel without displaying any user, message, record, or identifier. The rendered text confirms that recipients must be approved users; messages have no patient, Research ID, file, or clinical-record link; and the application blocks MUNR IDs plus patient-name, phone-number, and national-ID references. The page also presents the complete manual warning that report text and clinical record details must remain out of messages.

The browser was scrolled to the full messaging panels. The two panels remain legible side by side on desktop: the left panel identifies direct work conversations as separate from records, and the right panel visibly lists the three approval and identifier-boundary rules followed by the complete warning. This is public, non-patient workflow evidence only; it does not represent a sent message or authenticated chat interaction.

After the expanded identifier-validation update, the public messaging panel was reopened in the live browser. It now visibly states that the app blocks MUNR IDs and obvious patient or contact identifiers in both English and Arabic. Its warning visibly covers patient information, names, contact details, addresses, dates of birth, national or medical-record numbers, MUNR Research IDs, report text, and clinical record details, while continuing to display no user, message, or patient data.

The project preview renderer captured desktop layouts for `/records/new` and `/`, visibly showing the active **Stroke** pathway, the history / examination / discharge-treatment card, the brain-imaging overview visual, and the clinical workflow board. These renderer captures are useful layout evidence but are not treated as a replacement for a real browser-session authentication check.

The code-level update was validated with TypeScript, Vitest, and a production build. The unprotected server startup and the protected access gate both loaded after the latest clinical workflow changes.

The latest messaging validation passed TypeScript, all **16** Vitest tests, and the production build. The test suite explicitly proves that an approved user cannot read a direct-message thread for a recipient who is no longer approved, that the database thread reader is not invoked for that rejected request, and that expanded English and Arabic direct-identifier examples are rejected.

## Deferred verification

The sandbox browser does not hold an approved OAuth session, and the user explicitly asked to bypass the sign-in step and live interaction check for now. A later approved browser-session review remains required for interactive checks of all cohort selectors and messaging flows. The renderer captures and contract tests evidence implementation and layout only; they do not constitute authenticated browser verification.

## Supplied preview artwork

The user-supplied Mansoura University Neurology Center artwork is now hosted through the project asset storage URL and replaces the former small abstract preview hero image on `/workflow-preview`. Desktop capture shows the complete artwork in a bordered right-side hero panel beside the non-patient preview title and notice. Mobile capture shows the artwork below the title in a responsive card with its full institutional mark and a clear caption identifying it as preview branding. The public page continues to state that it contains no patient records, sample cases, identities, contact details, or live registry data. TypeScript, 16 Vitest tests, and the production build passed after integration.

## Mobile artwork-card interaction update

The supplied preview artwork card now uses a restrained 200 ms lift/shadow transition on hover, a subtle press-scale response on touch, and a 500 ms image zoom transition. The card declares `touch-pan-y` so the page retains natural vertical touch scrolling, while `motion-reduce:transition-none` and `motion-reduce` image handling respect reduced-motion preferences. Mobile capture at 375 px shows the artwork card full-width with readable wrapped caption text and no horizontal overflow. Desktop capture at 1280 px preserves the two-column hero composition and caption legibility. A screenshot cannot simulate a finger gesture, so touch physics are evidenced by the rendered classes and responsive layout rather than a real-device gesture test.

## Save/Favorite artwork card

The public artwork card now includes a keyboard-accessible Save button with an 11 px minimum-height touch target, visible pressed state, bookmark icon swap, and clear accessible labels for saving or removing the preview artwork from favorites. Mobile capture at 375 px shows the control comfortably inset in the artwork card without covering the main institutional mark; desktop capture at 1280 px preserves the same placement and hierarchy. The state is stored only under a fixed preview-specific key in the browser's local storage, with a safe fallback when storage is unavailable; no patient, user, or registry data is persisted.

## Save/Favorite state verification

A temporary local Chromium session exercised the actual preview control without any account, user, or registry data. The initial state rendered `Save` with `aria-pressed=false` and no stored value; one click changed it to `Saved`, `aria-pressed=true`, and `localStorage` value `true`; a second click returned it to `Save`, `aria-pressed=false`, and removed the storage value. This confirms both toggle states and local-only persistence behavior. The test used `http://127.0.0.1:3000/workflow-preview` solely for isolated verification and did not affect production data.

The same isolated Chromium state exercise was repeated at a 1280 px desktop viewport with identical results: `Save` / false / no storage, then `Saved` / true / stored `true`, then `Save` / false / storage removed. Together with the 375 px run, both responsive widths have direct state-transition evidence.

## Public Share artwork card

The artwork card now places a Share button beside Save at both 375 px and 1280 px widths without obscuring the institutional artwork or the non-patient caption. An isolated Chromium run verified both share paths using only the public workflow URL: a mocked native-share handler received the public title, public workflow description, and `/workflow-preview` URL; with native sharing unavailable, the fallback copied that same public URL and visibly changed the button label to `Copied`. No patient, user, record, or registry data was included in either payload.

## Saved Items surface

The public preview header now exposes a Saved items trigger with a count badge at both 375 px and 1280 px widths; the layout remains legible without crowding the public preview badge, secure-access link, or artwork controls. Direct isolated Chromium exercises at both viewport widths verified the complete local-only flow: the modal opens with `Saved items` and a `No saved items yet` empty state at count 0; saving the public artwork produces a stored public card and Remove action at count 1; removing it restores the empty state, count 0, and clears the browser storage key. No patient, user, clinical-record, or live registry data appears in the modal or its storage.

## Bottom save/remove notifications

The global toast surface is configured at the bottom-right of the screen. Direct isolated Chromium checks at both 375 px and 1280 px verified that saving emits `Artwork saved to favorites` and removing emits `Artwork removed from favorites`; the toast container reports `data-x-position="right"` and `data-y-position="bottom"` at both widths. These confirmations use only public artwork state and do not display or persist patient, user, record, or registry information.

## Save confirmation animation

At both 375 px and 1280 px widths, a direct Chromium click changed the Save control to `Saved`, set `aria-pressed=true`, applied the `save-confirm` class, and reported the `save-confirm` animation name. After its 520 ms completion window, the animation class cleared while the saved state remained. With reduced motion emulated, the save state still changed correctly but the computed animation name was `none`, confirming that the visual motion is suppressed for users who request reduced motion.

## Saved Items search and filter

With the public preview artwork saved locally, isolated Chromium checks at both 375 px and 1280 px confirmed the discovery controls inside Saved Items: the default All items filter shows the card; a `Mansoura` search preserves the matching card; an unmatched search shows the explicit `No matching saved items` state without the card; Clear search restores the list; and selecting Public preview retains the card with `aria-pressed=true`. These controls search only the local public-preview label text and never query, expose, or store patient, user, clinical-record, or live registry information.

## Confirmed Clear All

At both 375 px and 1280 px widths, direct isolated Chromium checks verified that Clear all first opens an alert titled `Clear saved items?` while the public preview storage value remains present. Choosing Keep saved items retains both the stored value and card. Confirming Clear all removes the local storage value, updates the Saved items count to 0, renders the empty state, and emits the bottom toast `Saved items cleared`. The confirmation explicitly states that the action affects only public preview cards on this device and does not affect patient, user, clinical-record, or live registry data.

## Owner-only protected data boundary

The protected Access Management screen now states that no protected record-clear or deletion action is currently enabled. It documents that any future destructive registry-data control must be bound server-side to Abdelrahman Ibrahim Rashad’s registered OAuth identity and administrator role, rather than to a display name or local password. The standard sandbox browser remains unauthenticated, so this protected-screen wording is implementation and build evidence only; a future approved OAuth session is required before claiming live visual verification.

## Locked Clear All state

In the normal unauthenticated browser session, a saved public-preview card remains visible inside Saved Items while Clear all is visibly muted, carries a lock overlay, has the title `Available only to an approved administrator`, and is semantically disabled. The accompanying instruction states that Clear all becomes available only after secure sign-in as an approved administrator. The extracted browser state confirmed `disabled: true`. The shared access-rule unit test separately verifies that only `{ role: "admin", accessStatus: "approved" }` enables the action, while absent, user, pending-admin, and suspended-admin states are rejected.
