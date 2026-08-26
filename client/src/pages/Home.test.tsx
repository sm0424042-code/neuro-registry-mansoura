import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BROKEN_IMAGE_REPORT_TEXT, canRetryHomeHeroImage, COPY_IMAGE_LINK_SUCCESS_DURATION_MS, COPY_IMAGE_LINK_TEXT, getCopyableHomeHeroMediaUrl, getCopyImageLinkButtonClass, getHomeHeroMediaSource, HomeHeroMedia, HOME_HERO_RETRY_FAILURE_LIMIT, HOME_HERO_UNAVAILABLE_TEXT, RETRY_LOADING_TEXT, RETRY_TOOLTIP_TEXT } from "./Home";

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
    expect(limitedMarkup).toContain("absolute inset-0 z-20 grid place-items-center");
    expect(limitedMarkup).toContain("bg-[#020c0e]/65");
    expect(limitedMarkup).toContain("backdrop-blur-sm");
    expect(limitedMarkup).toContain("unavailable-overlay-enter");
    expect(limitedMarkup).toContain(COPY_IMAGE_LINK_TEXT);
    expect(limitedMarkup).toContain("Copy the original image link to open in a new tab");
  });

  it("copies an absolute original-image URL suitable for opening in another tab", () => {
    expect(getCopyableHomeHeroMediaUrl("/manus-storage/example.png?retry=3", "https://registry.example")).toBe("https://registry.example/manus-storage/example.png?retry=3");
  });

  it("uses a temporary green style after a successful copied-link confirmation", () => {
    expect(COPY_IMAGE_LINK_SUCCESS_DURATION_MS).toBe(2200);
    expect(getCopyImageLinkButtonClass(false)).toContain("bg-[#123c44]/90");
    expect(getCopyImageLinkButtonClass(true)).toContain("bg-[#237a49]");
    expect(getCopyImageLinkButtonClass(true)).toContain("border-[#b7f3cc]");
    expect(getCopyImageLinkButtonClass(true)).toContain("motion-reduce:transition-none");
  });

  it("shows a busy retry spinner and prevents duplicate clicks while the original image reloads", () => {
    const loadingMarkup = renderToStaticMarkup(<HomeHeroMedia initialMode="fallback" initialIsRetryLoading />);

    expect(RETRY_LOADING_TEXT).toBe("Retrying…");
    expect(loadingMarkup).toContain("Retrying…");
    expect(loadingMarkup).toContain('disabled=""');
    expect(loadingMarkup).toContain('aria-busy="true"');
    expect(loadingMarkup).toContain("animate-spin");
    expect(loadingMarkup).toContain("motion-reduce:animate-none");
    expect(loadingMarkup).toContain("Retrying the original image. Please wait.");
  });

  it("shows an accessible static-media report action only at the terminal fallback state", () => {
    const idleMarkup = renderToStaticMarkup(<HomeHeroMedia initialMode="fallback" initialFailedRetryAttempts={HOME_HERO_RETRY_FAILURE_LIMIT} />);
    const reportedMarkup = renderToStaticMarkup(<HomeHeroMedia initialMode="fallback" initialFailedRetryAttempts={HOME_HERO_RETRY_FAILURE_LIMIT} reportState="reported" />);

    expect(idleMarkup).toContain(BROKEN_IMAGE_REPORT_TEXT);
    expect(idleMarkup).toContain("Report the static homepage image problem to administration");
    expect(reportedMarkup).toContain("Reported");
    expect(reportedMarkup).toContain("The static image problem was reported to administration.");
  });
});
