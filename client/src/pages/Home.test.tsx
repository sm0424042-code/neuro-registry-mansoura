import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { canRetryHomeHeroImage, getHomeHeroMediaSource, HomeHeroMedia, HOME_HERO_RETRY_FAILURE_LIMIT, HOME_HERO_UNAVAILABLE_TEXT, RETRY_TOOLTIP_TEXT } from "./Home";

describe("HomeHeroMedia", () => {
  it("defers the heavy homepage visual while reserving its styled visual surface", () => {
    const markup = renderToStaticMarkup(<HomeHeroMedia />);
    expect(markup).toContain('loading="lazy"');
    expect(markup).toContain('decoding="async"');
    expect(markup).toContain("mansoura-brain-imaging-overview");
    expect(markup).toContain("absolute inset-0 h-full w-full object-cover");
  });

  it("uses the embedded fallback and makes retry request a fresh original-image URL", () => {
    expect(getHomeHeroMediaSource("fallback")).toMatch(/^data:image\/svg\+xml/);
    expect(getHomeHeroMediaSource("original", 0)).toContain("mansoura-brain-imaging-overview");
    expect(getHomeHeroMediaSource("original", 2)).toContain("?retry=2");
  });

  it("shows an accessible retry control only in the fallback state", () => {
    const originalMarkup = renderToStaticMarkup(<HomeHeroMedia />);
    const fallbackMarkup = renderToStaticMarkup(<HomeHeroMedia initialMode="fallback" />);

    expect(originalMarkup).not.toContain("Retry loading the original neural-network image");
    expect(fallbackMarkup).toContain("Retry loading the original neural-network image");
    expect(fallbackMarkup).toContain("Original image unavailable. A fallback visual is shown.");
    expect(fallbackMarkup).toContain("Abstract neural-network fallback visual — no patient image");
    expect(RETRY_TOOLTIP_TEXT).toBe("Try loading the original image again");
    expect(fallbackMarkup).toContain('data-slot="tooltip-trigger"');
    expect(fallbackMarkup).toContain("hover:-translate-y-0.5");
    expect(fallbackMarkup).toContain("group-hover:rotate-[-20deg]");
    expect(fallbackMarkup).toContain("motion-reduce:transform-none");
  });

  it("hides Retry and explains image unavailability after three failed retry attempts", () => {
    const limitedMarkup = renderToStaticMarkup(<HomeHeroMedia initialMode="fallback" initialFailedRetryAttempts={HOME_HERO_RETRY_FAILURE_LIMIT} />);

    expect(canRetryHomeHeroImage(0)).toBe(true);
    expect(canRetryHomeHeroImage(HOME_HERO_RETRY_FAILURE_LIMIT - 1)).toBe(true);
    expect(canRetryHomeHeroImage(HOME_HERO_RETRY_FAILURE_LIMIT)).toBe(false);
    expect(limitedMarkup).not.toContain("Retry loading the original neural-network image");
    expect(limitedMarkup).toContain(HOME_HERO_UNAVAILABLE_TEXT);
    expect(limitedMarkup).toContain('role="status"');
  });
});
