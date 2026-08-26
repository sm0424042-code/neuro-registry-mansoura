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

The project preview renderer captured desktop layouts for `/records/new` and `/`, visibly showing the active **Stroke** pathway, the history / examination / discharge-treatment card, the brain-imaging overview visual, and the clinical workflow board. These renderer captures are useful layout evidence but are not treated as a replacement for a real browser-session authentication check.

The code-level update was validated with TypeScript, Vitest, and a production build. The unprotected server startup and the protected access gate both loaded after the latest clinical workflow changes.

## Deferred verification

The sandbox browser does not hold an approved OAuth session, and the user explicitly asked to skip the sign-in step. A later approved browser-session review remains required for interactive checks of all cohort selectors, especially MS and CIDP-specific editor controls. The renderer captures and contract tests evidence implementation and layout only; they do not constitute authenticated browser verification.
