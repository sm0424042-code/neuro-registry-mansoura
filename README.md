# Mansoura University Neurology Research Registry

## Purpose and operating boundary

This project is an **English-language, research-only neurology registry** for Mansoura University. It supports structured, pseudonymised research records; it is not a patient-facing portal, a clinical communication channel with patients, or a directory of patient contact information.

Each research record is identified in the application by a generated **MUNR Research ID**. The application must not use patient names, telephone numbers, email addresses, postal addresses, national IDs, hospital identifiers, medical-record numbers, dates of birth, or contact details as record identifiers. These exclusions apply equally to forms, uploads, messages, exports, public previews, operational notifications, copied links, and automated tests.

> **Governance principle:** A display name identifies how a person is presented in the interface. It does not grant access. Registry authority is determined only by the authenticated OAuth identity, approval status, and server-enforced role.

## Registry configuration

| Setting | Current configuration | Implementation boundary |
|---|---|---|
| Institution | Mansoura University | Presented throughout the registry as the institutional context. |
| Interface language | English | The clinical interface and controlled labels are English-language. |
| Research identifier | Generated `MUNR` Research ID | The user-visible record key; it is not a patient name or hospital number. |
| Cohorts | Stroke, Multiple Sclerosis, Abnormal Movements, Guillain–Barré Syndrome, Myasthenia Gravis, Myelopathy, Neuro-ophthalmology, and CIDP | Cohort-specific evaluation and investigation fields are used instead of one generic assessment. |
| Record lifecycle | Screened, enrolled, completed, withdrawn, or ineligible | Separate data-quality and completeness states identify work requiring completion or review. |
| Follow-up | Baseline, routine, post-discharge, emergency, telemedicine, or other research follow-up | Follow-up remains part of the pseudonymised research record. |
| Files | Protected research-file storage with controlled metadata | File access is restricted to approved registry users; exports do not include storage URLs or upload metadata. |
| Profile picture | Optional JPEG, PNG, or WebP image up to 2 MB for an approved user | Stored in the separate `user_profiles` table and protected object storage; never attached to a clinical record, public preview, message, notification, or export. |
| Messaging | Direct messages between approved registry users | Messages must not contain Research IDs, direct identifiers, or contact information. |
| Export | Administrator-initiated research CSV export | The export uses the MUNR Research ID and age bands rather than direct identifiers. Every export remains subject to the approved research protocol and de-identification review before release. |
| Public route | `/workflow-preview` | Uses fixed, data-free workflow content and abstract artwork only; it never queries protected registry content. |

## Owner and approval governance

**Abdelrahman Ibrahim Rashad** is documented as the intended future owner and registration approver of the registry. The name is a **display label only** until an actual secure OAuth registration produces the corresponding platform identity. No local username, password, national ID, or name-matching rule is created or accepted as a substitute for this process.

| Required property | Expected value or source | Why it is required |
|---|---|---|
| Display name | `Abdelrahman Ibrahim Rashad` | Identifies the intended owner in administrative documentation and approved interface copy. It is not an authorization key. |
| OAuth identity | Platform-issued `openId` from successful secure OAuth registration | The immutable identity used to bind administrative authority. |
| Owner binding | `OWNER_OPEN_ID` configuration matched exactly to the registered OAuth `openId` | Ensures owner recognition is identity-based rather than name-based. The value is secret configuration and must not be committed or printed. |
| Access status | `approved` | Required server-side before registry records, files, messages, reports, or exports can be accessed. |
| Role | `admin` | Required server-side for access administration and de-identified exports. |
| Approval authority | Existing approved administrator | New OAuth accounts begin as `pending`; approval is an explicit administrative action. |

### Owner activation procedure

The following sequence preserves the intended ownership model without creating local credentials or relying on personally supplied identifiers.

1. Abdelrahman Ibrahim Rashad registers through the project’s secure OAuth flow.
2. An existing approved administrator verifies the legitimate account through the approved administrative process.
3. The platform-issued OAuth `openId` is bound to the protected `OWNER_OPEN_ID` configuration, outside source control.
4. At sign-in, the server compares the OAuth `openId` with `OWNER_OPEN_ID`. Only an exact match is maintained as `approved` with the `admin` role; the display name is never used as the match key.
5. An administrator confirms that protected access, approval controls, and de-identified export controls behave as intended before operational use.

The project deliberately does **not** document, store, reproduce, or validate a local username/password pair for the owner. A name typed into a registration form must never result in owner or administrator access.

### Owner-control properties

The owner configuration is intentionally small and explicit. It should not be extended with a local credential, national ID, email-address matching rule, or client-side “owner” flag.

| Property | Control | Operational effect |
|---|---|---|
| Identity source | OAuth `openId` only | Prevents a typed display name from granting authority. |
| Exact owner match | `openId === OWNER_OPEN_ID` | Establishes the owner binding only after secure registration and protected configuration. |
| Privilege state | `accessStatus = approved` and `role = admin` | Requires both approval and administrator role before sensitive administration/export actions. |
| Server enforcement | Approved and administrator procedure checks | Prevents bypass through a modified browser, hidden control, or URL. |
| Change authority | Existing approved administrator and protected runtime configuration | Requires deliberate server-side promotion or owner-binding change; it is not self-service. |
| Auditability | Access-status changes and research exports are logged | Provides an accountable record of privileged governance events without reproducing clinical narratives. |

## Access-control model

| Level | Server-side requirement | Permitted capabilities |
|---|---|---|
| Public visitor | No authenticated session | May view only the data-free workflow preview. |
| Authenticated, pending, or suspended user | Secure OAuth session, but no approved status | Cannot access registry records, protected files, internal messages, exports, or reporting functions. |
| Approved user | OAuth session with `accessStatus = approved` | May use permitted registry records, protected files, and approved-user messaging. |
| Approved administrator | Approved OAuth user with `role = admin` | May manage access status and produce de-identified exports. |
| Future owner | Approved administrator whose OAuth `openId` exactly matches `OWNER_OPEN_ID` | Holds the same server-enforced administrative authority; the display name remains presentation-only. |

Access control is enforced in the server router through separate public, protected, approved-user, and administrator procedures. User-interface disabling or hidden controls are explanatory safeguards only; they are not authorization controls.

## Technical settings and secret handling

| Configuration key | Purpose | Handling rule |
|---|---|---|
| `DATABASE_URL` | Database connection for registry metadata | Platform-managed secret; never commit or display the value. |
| `JWT_SECRET` | Signs session cookies | Platform-managed secret; never commit, copy, or expose it. |
| `VITE_APP_ID` | OAuth application identifier | Supplied by the platform runtime; do not hard-code a replacement. |
| `OAUTH_SERVER_URL` | OAuth service endpoint | Platform-managed configuration used by the authentication flow. |
| `OWNER_OPEN_ID` | Canonical identity binding for the project owner | Set only after secure OAuth registration; never infer from a name or enter into source code. |
| `OWNER_NAME` | Project-owner display context | Presentation/notification context only; not an authorization control. |
| `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY` | Platform services, including fixed owner notifications | Treat as protected runtime configuration and never expose in browser code or documentation examples. |

The application uses React and Vite on the client, with an Express and tRPC server, Drizzle/MySQL-compatible persistence, and Manus OAuth. Authorisation-relevant procedures reside in `server/routers.ts`; user and record structures are defined in `drizzle/schema.ts`; database enforcement helpers are in `server/db.ts`.

## Privacy and data-handling rules

The registry is pseudonymised by design. Controlled cohort-specific fields are preferred over broad free text. Any free-text clinical field, uploaded filename, message, notification, or report must be screened so that it does not introduce a direct identifier, contact detail, medical-record reference, or a Research ID coupled with identifying context.

| Surface | Required protection |
|---|---|
| Records | Use the MUNR Research ID and controlled research variables. Do not create patient-name or contact fields. |
| Attachments | Store only in protected object storage; validate size, MIME type, and safe filename. Do not use identifying filenames. |
| Profile pictures | Restrict upload and retrieval to the approved owner of the profile. Keep the storage reference in `user_profiles`, separate from research records and all export queries. |
| Messages | Limit participation to approved users and reject direct identifiers before persistence. |
| Audit trail | Record actor, action type, timestamp, and safe record reference without copying clinical narratives. |
| Export | Release only protocol-approved, de-identified research rows; remove direct identifiers, user-assignment details, file metadata, and storage links, and complete a release review before disclosure. |
| Notifications | Use fixed operational messages with no record, patient, user, or clinical payload. |
| Public preview | Keep content fixed, non-patient, and data-free; do not request live records or user content. |

The protected homepage’s non-patient illustration includes a local fallback, retry limit, copy-link control, and an approved-user-only report action. The report accepts no client-supplied URL, free text, record content, or identifier; it sends a fixed, non-sensitive notification with a server-side cooldown.

## Validation and operational readiness

Before enabling operational use, verify server-side denial for unauthenticated, pending, suspended, and non-administrator callers. Confirm that all approved-user and administrator routes uphold the exclusions above; also confirm that exports remain de-identified and that files/messages cannot be used to transmit identifiers.

The codebase is checked with the following commands after implementation changes:

```bash
pnpm check
pnpm test
pnpm build
```

Automated TypeScript, test, and production-build checks have been run for the implemented registry features. Real browser verification with a legitimate approved OAuth session remains intentionally deferred until such an account is available. This limitation must remain documented rather than treated as completed testing. In particular, the first owner activation must be verified against the true registered OAuth `openId`; it must never be inferred from the future owner’s display name.

## Implementation map

| Area | Primary location |
|---|---|
| Authentication and authorization routes | `server/routers.ts` |
| User, record, audit, and message schema | `drizzle/schema.ts` |
| Pseudonymisation and de-identified export logic | `server/registry.ts` |
| Database access and approval helpers | `server/db.ts` |
| Protected record and administrative interfaces | `client/src/pages/` |
| Public data-free workflow preview | `client/src/pages/PublicWorkflowPreview.tsx` |
| Privacy-safe homepage media controls | `client/src/pages/Home.tsx` |
| Governance guidance | `/home/ubuntu/skills/pseudonymised-clinical-registry-governance/SKILL.md` |

## Change-control requirement

Any proposed feature involving creation, deletion, export, upload, download, messaging, sharing, copying, reporting, or notification of data must first define: the data classification, the exact server-side access level, direct-identifier exclusion behaviour, and a denied-caller test. Features must not widen access, add local credentials, or expose protected data in public content, browser-local preferences, analytics, logs, notifications, copied links, or tests.
