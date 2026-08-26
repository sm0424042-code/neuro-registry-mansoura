import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { applyHomeHeroFallback, HomeHeroMedia } from "./Home";

describe("HomeHeroMedia", () => {
  it("defers the heavy homepage visual while reserving its styled visual surface", () => {
    const markup = renderToStaticMarkup(<HomeHeroMedia />);
    expect(markup).toContain('loading="lazy"');
    expect(markup).toContain('decoding="async"');
    expect(markup).toContain("mansoura-brain-imaging-overview");
    expect(markup).toContain("absolute inset-0 h-full w-full object-cover");
  });

  it("replaces a failed original image with the embedded privacy-safe fallback once", () => {
    const image = { src: "https://example.invalid/original.png", alt: "Original visual", dataset: {} } as Pick<HTMLImageElement, "src" | "alt" | "dataset">;
    applyHomeHeroFallback(image);
    const fallbackSrc = image.src;
    applyHomeHeroFallback(image);

    expect(image.dataset.fallbackApplied).toBe("true");
    expect(fallbackSrc).toMatch(/^data:image\/svg\+xml/);
    expect(image.src).toBe(fallbackSrc);
    expect(image.alt).toBe("Abstract neural-network fallback visual — no patient image");
  });
});
