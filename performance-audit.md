# Public Workflow Preview Performance Audit

**Scope.** This audit covers the public `/workflow-preview` page and the local Saved Items progressive-loading path only. It intentionally excludes protected registry routes, user sessions, patient records, uploads, and all clinical data. Measurements were taken in isolated headless Chromium sessions against a locally served production build on 2026-08-26.

## Method

The audit used a clean browser profile, a desktop viewport of 1280 × 720, browser navigation and resource-timing entries, and the current production bundle. The interaction sample saved the fixed public artwork and opened Saved Items; these are device-local public-preference actions only.

| Measurement area | Approach | Boundary retained |
|---|---|---|
| Page startup | Production navigation timing and resource timing | Public route only; no protected registry data |
| Bundle footprint | Production asset file size and gzip size | Static build output only |
| Saved Items responsiveness | Save action through the next animation frame, then open modal | Fixed public artwork preference in browser local storage |
| Skeleton behavior | Source and static-component test inspection | No test cards, records, or user data fabricated |

## Measured results

| Metric | Result | Interpretation |
|---|---:|---|
| DOM content loaded | **208 ms** | Local, clean-profile production-lab measurement; this is not an internet field metric. |
| Initial resources | **6** | Production route requested the app JS/CSS, font, diagnostic collector, analytics script, and the public auth-state query. |
| Resource transfer observed | **1,216,701 bytes** | Local response path did not reflect deployment compression; use gzip footprint for transfer planning. |
| Main JavaScript | **1,051,183 bytes raw / 269,232 bytes gzip** | The dominant production asset; this is a shared application bundle, not attributable to Skeleton Loading alone. |
| Main CSS | **139,115 bytes raw / 22,779 bytes gzip** | Includes existing application styling; Skeleton classes add only a small conditional use of the shipped component. |
| Public save → next animation frame | **21.3 ms** | Device-local state update remained responsive in the isolated run. |
| Saved Items network dependency | **None** | Saving and opening the modal use browser-local public preview state; the page’s independent auth-state query is not part of the Saved Items action. |

> **Interpretation:** The local Skeleton feature does not add a request, an API route, a record lookup, or patient-facing data to the public preview. Its visible cost is a deliberate **220 ms** loading interval when a future local collection has another page to reveal. This keeps the feedback under 300 ms, but it is still an intentional pagination delay rather than network time.

## Skeleton Loading assessment

The loading branch is conditionally mounted only when a further local page exists. It disables the fallback button, exposes a polite loading status, and renders two `aria-hidden` card-shaped placeholders. The existing template `Skeleton` component supplies the pulse; `motion-reduce:animate-none` suppresses that nonessential motion for users who prefer reduced motion. The component test confirms the empty non-loading state and the ten placeholders rendered across two skeleton cards while loading.

| Aspect | Outcome |
|---|---|
| Network calls introduced by Skeleton Loading | **0** |
| New patient, user, record, or registry content | **0** |
| Keyboard fallback while loading | Button is disabled with a wait cursor until the next local window is revealed. |
| Screen-reader feedback | Polite loading status is updated. |
| Motion preference | Skeleton pulse is disabled under reduced-motion preference. |

## Findings and safe next steps

The feature’s direct runtime impact is low because it uses local React state and conditional markup. No code optimization was applied during this audit: changing the 220 ms interval would trade away the requested visible feedback, and the measured local interaction remains responsive.

The main asset to watch is the existing shared JavaScript bundle. If the product later targets slower networks, the evidence-based next investigation is route-level code splitting for large protected screens or optional dashboard features, measured separately against published hosting with compression and real network conditions. The Skeleton path itself should transition from its fixed local delay to the completion of a real paging promise only if the future Saved Items source becomes asynchronous.

## Limitations

This is a controlled local production-build audit, not a Core Web Vitals field study. Browser timing in headless mode did not provide a stable first-contentful-paint or load-event value, and localhost transfer sizes do not reflect CDN compression, real mobile CPUs, network latency, cached repeat visits, or production analytics behavior. The currently public collection has one intentionally fixed artwork card, so the multi-page loading branch was validated by code and static component test rather than by inventing public cards or using any registry data.
