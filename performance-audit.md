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

## Lazy-loading follow-up

Route-level lazy loading was then applied to the public preview, protected dashboard layout, registry, editor, messaging, access-management, home, and not-found pages. Each route is wrapped in an accessible Suspense fallback; protected pages retain their original DashboardLayout gate after the relevant chunk arrives.

| Build comparison | Before route splitting | After route splitting | Change |
|---|---:|---:|---:|
| Shared entry JavaScript | 1,051.18 KB raw / 269.85 KB gzip | 631.27 KB raw / 190.02 KB gzip | **−419.91 KB raw (−39%) / −79.83 KB gzip (−29%)** |
| Public workflow page chunk | Included in the shared entry | 70.70 KB raw / 12.08 KB gzip, requested only for `/workflow-preview` | Deferred from application shell |
| Protected editor chunk | Included in the shared entry | 93.59 KB raw / 17.48 KB gzip | Not requested by public preview |
| Protected dashboard chunk | Included in the shared entry | 73.25 KB raw / 14.88 KB gzip | Not requested by public preview |

In the isolated local production run, `/workflow-preview` reached DOM content loaded in **168 ms** and first contentful paint in **192 ms**. Its resource trace contained the public workflow chunk and its direct UI dependencies, while no `PatientEditor`, `DashboardLayout`, `PatientRegistry`, `Messages`, or `AccessManagement` chunk was requested. The unauthenticated `/records/new` route still rendered the Authorised access gate and no registry records. These are local laboratory measurements, not field Core Web Vitals.

> **Interpretation:** The public preview still needs its own route chunk after the small application shell, so this change improves the shared initial payload rather than eliminating the preview’s own code. The primary benefit is that non-visible protected workspaces are no longer downloaded when a visitor opens the public, data-free page.

## Homepage media lazy-loading follow-up

The protected homepage hero uses a single abstract, non-patient brain visual. Its media element now uses native `loading="lazy"` and `decoding="async"`; the surrounding hero retains its existing fixed minimum-height surface and absolute media frame, preventing a layout shift while the image is pending. The attribute is verified by a direct component-render test. This change adds no API request, data field, or registry content.

The homepage itself remains behind the approved-access gate. In an unauthenticated visit, the Home route does not render and the hero image is not requested; the visitor instead sees only the existing Authorised access screen. For an approved user who reaches the overview, the browser can defer the heavy hero image until it is near the viewport while keeping the hero layout stable. The production build stayed within the previously measured lazy-route split: its shared entry is **631.27 KB raw / 190.01 KB gzip**.

## Homepage media fallback follow-up

If the original overview visual fails to load, its error handler now replaces it once with an embedded SVG neural-network illustration. The fallback is packaged with the Home route rather than fetched from a third party, keeps the existing object-cover media frame, and uses an explicit alternative text stating that it is an abstract fallback with no patient image. A guard on the image dataset prevents an error loop if the replacement path is reached again. The fallback adds no record, user, patient, clinical, or network data flow.

The Home route chunk increased from **5.85 KB gzip** to **6.67 KB gzip** after including the fallback illustration, a bounded **0.82 KB gzip** resilience cost that removes any fallback-network dependency. Unit coverage verifies the first failure replaces the source with the embedded SVG, retains the fallback after a repeated error call, and changes the alt text to the non-patient fallback description.

## Fallback retry follow-up

When the fallback is visible, a compact **Retry** button is positioned over the hero media. It is a semantic button with a descriptive accessible name and polite status text explaining that the original image is unavailable. Selecting it restores the original media source with an incremented `retry` query value, allowing the browser to make a fresh request instead of reusing a failed URL. A further failure returns to the embedded fallback; no protected record or API data is part of this cycle.

The Home route chunk is now **7.11 KB gzip**. The incremental retry control remains route-local and is not downloaded by the public workflow preview. Unit tests cover fallback-source selection, fresh retry URL selection, the absence of the Retry control during a normal image load, and its accessible presence when fallback state is active.

## Retry interaction refinement

The Retry control now has a compact visual lift, brighter border and teal glow on pointer hover, plus a restrained icon turn to signal the available reload action. Pressing it restores the button to its starting position with the existing scale acknowledgement. Keyboard focus remains visible with a high-contrast ring and offset, and all nonessential transform and transition effects are disabled under the reduced-motion preference. The implementation remains a style-only refinement; it does not change fallback, retry, network, or protected-data behavior.

## Retry tooltip follow-up

The fallback-only Retry control now uses the template’s Radix Tooltip component. Hovering or focusing the button reveals **Try loading the original image again** below the control, with the existing dark/teal visual language and reduced-motion-safe animation suppression. The button retains its explicit accessible name; the tooltip supplements rather than replaces it. The tooltip only exists with fallback state, so the normal successful-image path adds no extra interaction surface or data flow.

## Retry-limit follow-up

Retry is now bounded to **three failed reloads**. Each failed retry returns to the static fallback and increments the local failure count; after the third failure, the Retry button and tooltip are removed and an accessible status message states: **Image unavailable. The fallback visual remains available.** The fallback remains visible and stable, while successful original-image loads reset the failure count. Errors from the embedded fallback itself are ignored so the error state cannot loop. This remains a local media-state control with no patient, record, user, or registry data flow.

## Findings and safe next steps

The feature’s direct runtime impact is low because it uses local React state and conditional markup. No code optimization was applied during this audit: changing the 220 ms interval would trade away the requested visible feedback, and the measured local interaction remains responsive.

The main shared JavaScript asset is now materially smaller after route splitting. If the product later targets slower networks, the next evidence-based investigation is splitting large dependencies inside the remaining 631 KB shared shell and measuring against published hosting with compression and real network conditions. The Skeleton path itself should transition from its fixed local delay to the completion of a real paging promise only if the future Saved Items source becomes asynchronous.

## Limitations

This is a controlled local production-build audit, not a Core Web Vitals field study. Browser timing in headless mode did not provide a stable first-contentful-paint or load-event value, and localhost transfer sizes do not reflect CDN compression, real mobile CPUs, network latency, cached repeat visits, or production analytics behavior. The currently public collection has one intentionally fixed artwork card, so the multi-page loading branch was validated by code and static component test rather than by inventing public cards or using any registry data.
