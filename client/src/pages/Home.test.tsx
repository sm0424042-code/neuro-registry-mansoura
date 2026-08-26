import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getHomeHeroMediaSource, HomeHeroMedia } from "./Home";

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
  });
});
