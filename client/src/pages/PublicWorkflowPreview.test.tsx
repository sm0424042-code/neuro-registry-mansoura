import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SavedItemsBatchSkeleton } from "./PublicWorkflowPreview";

describe("SavedItemsBatchSkeleton", () => {
  it("renders two aria-hidden placeholder cards only while a local batch is loading", () => {
    expect(renderToStaticMarkup(<SavedItemsBatchSkeleton isVisible={false} />)).toBe("");

    const markup = renderToStaticMarkup(<SavedItemsBatchSkeleton isVisible />);
    expect(markup).toContain('aria-hidden="true"');
    expect((markup.match(/data-slot="skeleton"/g) ?? [])).toHaveLength(10);
    expect(markup).toContain("motion-reduce:animate-none");
  });
});
