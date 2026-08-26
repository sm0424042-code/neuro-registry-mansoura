# Visual QA Notes

## Verified in the current session

The protected `/records/new` route was opened in the live sandbox browser. It displayed the **Authorised access only** gate and did not expose registry data, confirming that a missing session cookie does not reveal protected research records.

The code-level update was validated with TypeScript, Vitest, and a production build. The unprotected server startup and the protected access gate both loaded after the latest clinical workflow changes.

## Deferred verification

The authenticated overview, registry, record editor, and access-management screens were **not** visually reviewed in the current session because the browser did not hold an approved OAuth session. The user explicitly asked to skip the sign-in step. In particular, the new Stroke complications, MS TB screening and adherence, immune therapy, NMOSD/MOGAD/GCA, and CIDP/vasculitic-neuropathy screens require a later authenticated visual review before they can be claimed as demonstrated in the live editor.
