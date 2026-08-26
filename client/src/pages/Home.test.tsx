import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HomeHeroMedia } from "./Home";

describe("HomeHeroMedia", () => {
  it("defers the heavy homepage visual while reserving its styled visual surface", () => {
    const markup = renderToStaticMarkup(<HomeHeroMedia />);
    expect(markup).toContain('loading="lazy"');
    expect(markup).toContain('decoding="async"');
    expect(markup).toContain("mansoura-brain-imaging-overview");
    expect(markup).toContain("absolute inset-0 h-full w-full object-cover");
  });
});
