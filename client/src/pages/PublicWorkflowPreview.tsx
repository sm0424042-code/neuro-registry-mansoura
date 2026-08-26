import { Badge } from "@/components/ui/badge";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { canClearAllSavedItems } from "@/lib/savedItemsAccess";
import { SAVED_ITEMS_PAGE_SIZE, nextVisibleSavedItemCount, visibleSavedItems } from "@/lib/savedItemsPagination";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileText,
  HeartPulse,
  Microscope,
  MessageSquare,
  Pill,
  Search,
  Share2,
  ShieldCheck,
  LockKeyhole,
  Trash2,
  UsersRound,
} from "lucide-react";

const brainVisual = "/manus-storage/478fad80-a175-11f1-995e-03d05cd60a9d_e14e1e86.png";
const artworkFavoriteKey = "munr.preview.artwork.favorite";
const savedItemsBatchLoadingDelay = 220;
const artworkSavedItem = {
  id: "mansoura-neurology-center-preview",
  category: "preview",
  title: "Mansoura University Neurology Center",
  description: "Non-patient artwork and public workflow preview.",
  imageUrl: brainVisual,
};

const workflows = [
  { icon: HeartPulse, title: "Stroke", tone: "bg-[#e8f6f3] text-[#28736a]", fields: ["NIHSS severity score and mRS outcome", "TOAST aetiology and dysphagia screen", "Stroke complication and functional outcome", "Discharge treatment"] },
  { icon: BrainCircuit, title: "Multiple Sclerosis", tone: "bg-[#eef1fb] text-[#59699a]", fields: ["EDSS and MSFC: 25-foot walk, 9-Hole Peg, PASAT-3", "Relapse activity and disease-modifying therapy", "Chest imaging, TB screen, and VZV immunity", "Infection-exclusion review and dated dose adherence"] },
  { icon: Microscope, title: "Abnormal Movements", tone: "bg-[#f8f1fa] text-[#83558b]", fields: ["Phenomenology and distribution", "Severity rating and functional impact", "Video / examination review", "Targeted imaging or testing"] },
  { icon: HeartPulse, title: "Guillain–Barré Syndrome", tone: "bg-[#eff7fb] text-[#4c7595]", fields: ["GBS disability score and MRC sum score", "Respiratory and autonomic status", "Electrodiagnostic pattern", "Immune-therapy pathway where relevant"] },
  { icon: HeartPulse, title: "Myasthenia Gravis", tone: "bg-[#fbf4e9] text-[#9a6e36]", fields: ["MGFA class and MG-ADL / QMG", "Ocular, bulbar, and respiratory evaluation", "Antibody / thymoma pathway", "Treatment response"] },
  { icon: BrainCircuit, title: "Myelopathy", tone: "bg-[#f0f5eb] text-[#5f7b4e]", fields: ["Functional disability and gait / mobility", "UMN / LMN signs and sensory level", "Bladder / bowel function", "Spine MRI and CSF pathway"] },
  { icon: Eye, title: "Neuro-ophthalmology", tone: "bg-[#fbf1e8] text-[#9c6b3c]", fields: ["Visual acuity, fields, and OCT", "Fundus / optic disc and RAPD", "NMOSD, MOGAD, and GCA classification", "AQP4/MOG and GCA pathway"] },
  { icon: Microscope, title: "CIDP & inflammatory neuropathy", tone: "bg-[#eff8f1] text-[#4d7d5c]", fields: ["Explicit CIDP variant: typical, MADSAM, distal, focal, motor, or sensory", "CIDP variant-pattern evaluation plus INCAT / ONLS and MRC sum score", "Sensory ataxia and EMG / NCS evidence", "Mononeuritis / vasculitic pathway, CSF, and immune-therapy safety"] },
] as const;

export default function PublicWorkflowPreview() {
  const { user } = useAuth();
  const [isArtworkSaved, setIsArtworkSaved] = useState(false);
  const [hasCopiedPreviewLink, setHasCopiedPreviewLink] = useState(false);
  const [isSavedItemsOpen, setIsSavedItemsOpen] = useState(false);
  const [isSaveConfirming, setIsSaveConfirming] = useState(false);
  const [savedSearch, setSavedSearch] = useState("");
  const [savedFilter, setSavedFilter] = useState<"all" | "preview">("all");
  const [isClearSavedOpen, setIsClearSavedOpen] = useState(false);
  const [visibleSavedCount, setVisibleSavedCount] = useState(SAVED_ITEMS_PAGE_SIZE);
  const [isLoadingSavedBatch, setIsLoadingSavedBatch] = useState(false);
  const saveAnimationTimeoutRef = useRef<number | null>(null);
  const savedBatchTimeoutRef = useRef<number | null>(null);
  const savedItemsScrollRef = useRef<HTMLDivElement | null>(null);
  const savedItemsLoadRef = useRef<HTMLDivElement | null>(null);
  const canClearSavedItems = canClearAllSavedItems(user);

  useEffect(() => {
    try {
      setIsArtworkSaved(window.localStorage.getItem(artworkFavoriteKey) === "true");
    } catch {
      // Private browsing or a restricted storage context should not block the preview.
    }
  }, []);

  useEffect(() => () => {
    if (saveAnimationTimeoutRef.current !== null) window.clearTimeout(saveAnimationTimeoutRef.current);
    if (savedBatchTimeoutRef.current !== null) window.clearTimeout(savedBatchTimeoutRef.current);
  }, []);

  const triggerSaveConfirmation = () => {
    if (saveAnimationTimeoutRef.current !== null) window.clearTimeout(saveAnimationTimeoutRef.current);
    setIsSaveConfirming(false);
    window.requestAnimationFrame(() => {
      setIsSaveConfirming(true);
      saveAnimationTimeoutRef.current = window.setTimeout(() => setIsSaveConfirming(false), 520);
    });
  };

  const updateArtworkSaved = (nextValue: boolean) => {
    setIsArtworkSaved(nextValue);
    try {
      if (nextValue) window.localStorage.setItem(artworkFavoriteKey, "true");
      else window.localStorage.removeItem(artworkFavoriteKey);
    } catch {
      // The visual state still works when browser storage is unavailable.
    }
    if (nextValue) triggerSaveConfirmation();
    else setIsSaveConfirming(false);
    toast.success(nextValue ? "Artwork saved to favorites" : "Artwork removed from favorites");
  };

  const toggleArtworkSaved = () => updateArtworkSaved(!isArtworkSaved);

  const clearAllSavedItems = () => {
    if (!canClearSavedItems) {
      toast.error("Administrator approval is required to clear all saved items");
      return;
    }
    setIsArtworkSaved(false);
    setIsSaveConfirming(false);
    setSavedSearch("");
    setSavedFilter("all");
    try {
      window.localStorage.removeItem(artworkFavoriteKey);
    } catch {
      // The local UI still clears if browser storage is restricted.
    }
    toast.success("Saved items cleared");
  };

  const sharePreview = async () => {
    const previewUrl = new URL("/workflow-preview", window.location.origin).toString();
    const shareData = {
      title: "Mansoura University Neurology Research Registry",
      text: "Explore the public, non-patient workflow preview.",
      url: previewUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(previewUrl);
      else {
        const helper = document.createElement("textarea");
        helper.value = previewUrl;
        helper.setAttribute("readonly", "");
        helper.className = "fixed opacity-0";
        document.body.appendChild(helper);
        helper.select();
        const copied = document.execCommand("copy");
        helper.remove();
        if (!copied) throw new Error("Copy command was unavailable");
      }
      setHasCopiedPreviewLink(true);
      window.setTimeout(() => setHasCopiedPreviewLink(false), 2200);
      toast.success("Public preview link copied");
    } catch {
      toast.error("Unable to copy the preview link", { description: "Copy the public preview URL from your browser address bar instead." });
    }
  };

  const savedSearchTerm = savedSearch.trim().toLowerCase();
  const savedPreviewItems = useMemo(() => isArtworkSaved ? [artworkSavedItem] : [], [isArtworkSaved]);
  const filteredSavedItems = useMemo(() => savedPreviewItems.filter((item) => (savedFilter === "all" || item.category === savedFilter) && [item.title, item.description, "public preview", "preview artwork"].some((value) => value.toLowerCase().includes(savedSearchTerm))), [savedPreviewItems, savedFilter, savedSearchTerm]);
  const visibleSavedItemsList = visibleSavedItems(filteredSavedItems, visibleSavedCount);
  const hasMoreSavedItems = visibleSavedItemsList.length < filteredSavedItems.length;
  const loadMoreSavedItems = useCallback(() => {
    if (isLoadingSavedBatch || !hasMoreSavedItems) return;
    setIsLoadingSavedBatch(true);
    if (savedBatchTimeoutRef.current !== null) window.clearTimeout(savedBatchTimeoutRef.current);
    savedBatchTimeoutRef.current = window.setTimeout(() => {
      setVisibleSavedCount((count) => nextVisibleSavedItemCount(count, filteredSavedItems.length));
      setIsLoadingSavedBatch(false);
      savedBatchTimeoutRef.current = null;
    }, savedItemsBatchLoadingDelay);
  }, [filteredSavedItems.length, hasMoreSavedItems, isLoadingSavedBatch]);

  useEffect(() => {
    if (savedBatchTimeoutRef.current !== null) window.clearTimeout(savedBatchTimeoutRef.current);
    setIsLoadingSavedBatch(false);
    setVisibleSavedCount(SAVED_ITEMS_PAGE_SIZE);
  }, [savedSearchTerm, savedFilter, isArtworkSaved]);

  useEffect(() => {
    const sentinel = savedItemsLoadRef.current;
    if (!isSavedItemsOpen || !hasMoreSavedItems || !sentinel || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMoreSavedItems();
    }, { root: savedItemsScrollRef.current, rootMargin: "140px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isSavedItemsOpen, hasMoreSavedItems, loadMoreSavedItems]);

  return (
    <main className="min-h-screen bg-[#f6faf8] text-[#203943]">
      <section className="relative overflow-hidden bg-[#091d30] px-5 py-8 text-white md:px-10 md:py-12">
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-[#c6f1e6]"><ShieldCheck className="h-3.5 w-3.5" />PUBLIC, NON-PATIENT DEMONSTRATION</div>
                <button type="button" aria-haspopup="dialog" onClick={() => setIsSavedItemsOpen(true)} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bcefe3] active:scale-[0.97] motion-reduce:transition-none"><BookmarkCheck className="h-3.5 w-3.5 text-[#bcefe3]" />Saved items<span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#bcefe3] px-1 text-[10px] font-bold text-[#092238]">{isArtworkSaved ? 1 : 0}</span></button>
              </div>
              <a href="/records/new" className="text-sm text-[#c6f1e6] underline-offset-4 hover:underline">Return to secure access</a>
            </div>
            <h1 className="mt-7 max-w-3xl font-display text-3xl leading-tight md:text-5xl">Mansoura University Neurology Research Registry</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">A view of the new clinical workflow structure. This page contains no patient records, sample cases, identities, contact details, or live registry data.</p>
          </div>
          <div className="group relative touch-pan-y select-none overflow-hidden rounded-2xl border border-white/15 bg-[#061323] shadow-2xl shadow-black/30 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(3,13,28,0.42)] active:translate-y-0 active:scale-[0.99] motion-reduce:transition-none">
            <img alt="Mansoura University Neurology Center brain and neural-network artwork" src={brainVisual} className="h-full min-h-[210px] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transition-none" />
            <div className="absolute right-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] gap-2">
              <button type="button" aria-pressed={isArtworkSaved} aria-label={isArtworkSaved ? "Remove preview artwork from favorites" : "Save preview artwork to favorites"} onClick={toggleArtworkSaved} className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-[#061323]/80 px-3.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition-[background-color,transform] duration-150 ease-out hover:bg-[#12344a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bcefe3] active:scale-[0.97] motion-reduce:transition-none ${isSaveConfirming ? "save-confirm border-[#bcefe3] bg-[#123d50]" : ""}`}>
                {isArtworkSaved ? <BookmarkCheck className="h-4 w-4 text-[#bcefe3]" /> : <Bookmark className="h-4 w-4" />}
                <span>{isArtworkSaved ? "Saved" : "Save"}</span>
              </button>
              <button type="button" aria-label="Share public workflow preview" onClick={sharePreview} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-[#061323]/80 px-3.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition-[background-color,transform] duration-150 ease-out hover:bg-[#12344a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bcefe3] active:scale-[0.97] motion-reduce:transition-none">
                <Share2 className="h-4 w-4" />
                <span>{hasCopiedPreviewLink ? "Copied" : "Share"}</span>
              </button>
              <span className="sr-only" aria-live="polite">{hasCopiedPreviewLink ? "Public preview link copied." : ""}</span>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#061323] via-[#061323]/70 to-transparent px-5 pb-4 pt-12"><p className="text-[10px] font-bold tracking-[0.16em] text-[#bcefe3]">MANSOURA UNIVERSITY · NEUROLOGY CENTER</p><p className="mt-1 text-xs text-slate-200">Brand artwork supplied for this non-patient preview · touch to explore</p></div>
          </div>
        </div>
      </section>

      <Dialog open={isSavedItemsOpen} onOpenChange={setIsSavedItemsOpen}>
        <DialogContent className="border-[#cfe5dd] bg-[#f8fcfa] p-0 text-[#203943] sm:max-w-xl">
          <DialogHeader className="border-b border-[#dcebe6] px-6 pt-6 pb-5 text-left">
            <DialogTitle className="flex items-center gap-2 font-display text-2xl text-[#1e444c]"><BookmarkCheck className="h-5 w-5 text-[#24776a]" />Saved items</DialogTitle>
            <DialogDescription className="mt-2 leading-6 text-[#587476]">Saved preview cards are kept on this device only. They do not include patient records, user information, or live registry data.</DialogDescription>
          </DialogHeader>
          {isArtworkSaved ? (
            <div className="space-y-5 p-6">
              <div className="space-y-3">
                <label htmlFor="saved-items-search" className="text-xs font-bold tracking-[0.13em] text-[#4e7775]">FIND SAVED ITEMS</label>
                <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f8582]" /><input id="saved-items-search" value={savedSearch} onChange={(event) => setSavedSearch(event.target.value)} placeholder="Search public preview cards" className="min-h-11 w-full rounded-xl border border-[#cfe5dd] bg-white py-2 pl-10 pr-3 text-sm text-[#24434b] outline-none transition-colors placeholder:text-[#73908d] focus:border-[#4ba696] focus:ring-2 focus:ring-[#bfe9e0]" /></div>
                <div className="flex flex-wrap items-center justify-between gap-2" aria-label="Filter saved items"><div className="flex flex-wrap gap-2"><button type="button" aria-pressed={savedFilter === "all"} onClick={() => setSavedFilter("all")} className={`min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3caa98] ${savedFilter === "all" ? "border-[#24776a] bg-[#24776a] text-white" : "border-[#cce1da] bg-white text-[#39746d] hover:bg-[#eff9f6]"}`}>All items</button><button type="button" aria-pressed={savedFilter === "preview"} onClick={() => setSavedFilter("preview")} className={`min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3caa98] ${savedFilter === "preview" ? "border-[#24776a] bg-[#24776a] text-white" : "border-[#cce1da] bg-white text-[#39746d] hover:bg-[#eff9f6]"}`}>Public preview</button></div><button type="button" disabled={!canClearSavedItems} aria-describedby={!canClearSavedItems ? "clear-all-permission-hint" : undefined} title={!canClearSavedItems ? "Available only to an approved administrator" : "Clear all locally saved preview cards"} onClick={() => setIsClearSavedOpen(true)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-[#9b3b33] transition-colors hover:bg-[#fff0ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5685a] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-transparent"><span className="relative"><Trash2 className="h-3.5 w-3.5" /><LockKeyhole className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-[#f8fcfa] p-px text-[#9b3b33]" /></span>Clear all</button></div>
                {!canClearSavedItems && <p id="clear-all-permission-hint" className="flex items-center gap-1.5 text-xs leading-5 text-[#805f5a]"><LockKeyhole className="h-3.5 w-3.5 shrink-0" />Clear all is available only after secure sign-in as an approved administrator.</p>}
              </div>
              {filteredSavedItems.length > 0 ? (
                <div ref={savedItemsScrollRef} className="max-h-[min(56vh,34rem)] space-y-4 overflow-y-auto overscroll-contain pr-1" aria-label="Saved items results">
                  {visibleSavedItemsList.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-[#cfe5dd] bg-white shadow-sm">
                    <img src={item.imageUrl} alt={`${item.title} saved preview artwork`} className="h-40 w-full object-cover" />
                    <div className="p-5"><p className="text-[10px] font-bold tracking-[0.15em] text-[#3b7d73]">PUBLIC PREVIEW</p><h3 className="mt-1 font-display text-xl text-[#1e444c]">{item.title}</h3><p className="mt-2 text-sm leading-6 text-[#547175]">{item.description}</p><button type="button" onClick={() => updateArtworkSaved(false)} className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-[#cce1da] bg-white px-3.5 text-sm font-semibold text-[#276d65] transition-colors hover:bg-[#eff9f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3caa98]">Remove from saved items</button></div>
                  </article>)}
                  {hasMoreSavedItems ? <div ref={savedItemsLoadRef} className="space-y-3 py-3"><SavedItemsBatchSkeleton isVisible={isLoadingSavedBatch} /><div className="flex flex-col items-center gap-2"><button type="button" disabled={isLoadingSavedBatch} onClick={loadMoreSavedItems} className="min-h-10 rounded-lg border border-[#cce1da] bg-white px-3.5 text-sm font-semibold text-[#276d65] transition-colors hover:bg-[#eff9f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3caa98] disabled:cursor-wait disabled:opacity-70">{isLoadingSavedBatch ? "Loading next saved items" : "Load more saved items"}</button><p className="text-xs font-medium text-[#4f7773]" role="status" aria-live="polite">{isLoadingSavedBatch ? "Loading the next local preview cards…" : "More items load automatically as you scroll."}</p></div></div> : <p className="py-2 text-center text-xs text-[#5e7d7a]" aria-live="polite">Showing {visibleSavedItemsList.length} of {filteredSavedItems.length} saved item{filteredSavedItems.length === 1 ? "" : "s"}</p>}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#bddbd4] bg-[#f1faf7] px-5 py-9 text-center"><Search className="mx-auto h-6 w-6 text-[#43877d]" /><h3 className="mt-3 font-display text-lg text-[#24434b]">No matching saved items</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#587476]">Try a different search term or switch to All items.</p><button type="button" onClick={() => { setSavedSearch(""); setSavedFilter("all"); }} className="mt-4 min-h-9 rounded-lg border border-[#cce1da] bg-white px-3 text-sm font-semibold text-[#276d65] transition-colors hover:bg-[#eff9f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3caa98]">Clear search</button></div>
              )}
            </div>
          ) : (
            <div className="px-6 py-12 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e5f4ef] text-[#2b7d71]"><BookmarkCheck className="h-6 w-6" /></span><h3 className="mt-4 font-display text-xl text-[#24434b]">No saved items yet</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#587476]">Use the Save button on the public preview artwork card to keep it here for later on this device.</p></div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isClearSavedOpen} onOpenChange={setIsClearSavedOpen}>
        <AlertDialogContent className="border-[#efd0cb] bg-[#fffaf9] text-[#3b302e]">
          <AlertDialogHeader><AlertDialogTitle className="font-display text-2xl text-[#5d2925]">Clear saved items?</AlertDialogTitle><AlertDialogDescription className="leading-6 text-[#785954]">This removes the public preview cards saved on this device. It does not affect any patient, user, clinical-record, or live registry data.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Keep saved items</AlertDialogCancel><AlertDialogAction onClick={clearAllSavedItems} className="bg-[#a64138] text-white hover:bg-[#86342d]">Clear all</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mx-auto max-w-6xl space-y-8 px-5 py-8 md:px-10 md:py-12">
        <section className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-[#d5e8e3] bg-[#eff9f6]"><CardContent className="p-6">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d8f0e9] text-[#26736a]"><ClipboardCheck className="h-5 w-5" /></span><div><p className="text-[10px] font-bold tracking-[0.14em] text-[#3a7a72]">WHAT WAS ADDED</p><h2 className="font-display text-2xl text-[#1e444c]">Cohort-specific clinical capture</h2></div></div>
            <p className="mt-5 text-sm leading-6 text-[#4b6b6e]">There is no standard evaluation checklist shared across diseases. Each pathway exposes only its own relevant clinical, investigation, treatment, and follow-up fields for the selected neurology cohort.</p>
            <div className="mt-5 flex flex-wrap gap-2"><Badge className="bg-white text-[#28736a] hover:bg-white">8 neurology cohorts</Badge><Badge className="bg-white text-[#28736a] hover:bg-white">No direct identifiers</Badge><Badge className="bg-white text-[#28736a] hover:bg-white">Protected records</Badge></div>
          </CardContent></Card>
          <Card className="border-[#dce8e4]"><CardContent className="p-6">
            <p className="text-[10px] font-bold tracking-[0.14em] text-[#63807e]">RESEARCH-SAFE RECORD FLOW</p>
            <ol className="mt-5 space-y-3 text-sm text-slate-600"><PreviewStep number="1" label="MUNR Research ID and consent" /><PreviewStep number="2" label="Brief history and positive findings" /><PreviewStep number="3" label="Cohort-specific clinical evaluation" /><PreviewStep number="4" label="Protocol investigations and treatment safety" /><PreviewStep number="5" label="Completion ownership and follow-up" /></ol>
          </CardContent></Card>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-[#cfe5dd] bg-[#f0f9f6]"><CardContent className="p-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d8f0e9] text-[#26736a]"><MessageSquare className="h-5 w-5" /></span><div><p className="text-[10px] font-bold tracking-[0.14em] text-[#3a7a72]">APPROVED-USER MESSAGING</p><h2 className="font-display text-2xl text-[#1e444c]">Direct work conversations, separate from records</h2></div></div><p className="mt-4 text-sm leading-6 text-[#4b6b6e]">Approved registry users can communicate directly about operational research work. Messages are never connected to a research record, exported with registry data, or presented on this public page.</p><a href="/messages" className="mt-6 inline-flex items-center rounded-md bg-[#17616c] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#104f58]">Open secure messages<ArrowRight className="ml-2 h-4 w-4" /></a></CardContent></Card>
          <Card className="border-[#dce8e4]"><CardContent className="p-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff6e9] text-[#97652b]"><UsersRound className="h-5 w-5" /></span><div><p className="text-[10px] font-bold tracking-[0.14em] text-[#6d7977]">MESSAGE BOUNDARIES</p><h2 className="font-display text-2xl text-[#24434b]">How the protected chat works</h2></div></div><ol className="mt-5 space-y-3 text-sm leading-6 text-[#4b6669]"><PreviewStep number="1" label="Only approved registry users can appear as direct-message recipients." /><PreviewStep number="2" label="The conversation has no patient, Research ID, file, or clinical-record link." /><PreviewStep number="3" label="The app blocks MUNR IDs and obvious patient or contact identifiers in English and Arabic." /></ol><div className="mt-5 flex gap-3 rounded-xl border border-[#f0d8bb] bg-[#fff8ef] p-4 text-sm leading-6 text-[#805824]"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><p>Do not place patient information, names, contact details, addresses, dates of birth, national or medical-record numbers, MUNR Research IDs, report text, or clinical record details in messages. Use the secure record workflow for research data.</p></div></CardContent></Card>
        </section>

        <section>
          <div className="mb-4"><p className="text-[10px] font-bold tracking-[0.15em] text-[#47827a]">NEW CLINICAL PATHWAYS</p><h2 className="mt-1 font-display text-3xl text-[#1d3c46]">Visible form sections after secure sign-in</h2></div>
          <div className="grid gap-4 md:grid-cols-2">{workflows.map(({ icon: Icon, title, tone, fields }) => <Card key={title} className="border-[#e0ebe7] shadow-sm"><CardContent className="p-6"><div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span><h3 className="font-display text-xl text-[#25434b]">{title}</h3></div><div className="mt-5 space-y-3">{fields.map(field => <div key={field} className="flex gap-3 rounded-xl border border-[#e7efec] bg-[#fbfdfc] p-3 text-sm text-[#496467]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#4ba58e]" />{field}</div>)}</div></CardContent></Card>)}</div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <Card className="border-[#dce8e4]"><CardContent className="p-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf5fa] text-[#4c7798]"><FileText className="h-5 w-5" /></span><div><p className="text-[10px] font-bold tracking-[0.14em] text-[#5d7a84]">COMMON RECORD SECTIONS</p><h2 className="font-display text-2xl text-[#24434b]">Kept separate from clinical data</h2></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><PreviewField label="Brief clinical history" /><PreviewField label="Positive examination findings" /><PreviewField label="Discharge treatment" /><PreviewField label="Completion owner and missing items" /><PreviewField label="Secure investigation files" /><PreviewField label="Longitudinal follow-up" /></div></CardContent></Card>
          <Card className="border-[#cfe5dd] bg-[#f0f9f6]"><CardContent className="p-6"><Pill className="h-6 w-6 text-[#28736a]" /><p className="mt-4 text-[10px] font-bold tracking-[0.14em] text-[#3c7b72]">IMMUNE-THERAPY SAFETY</p><h2 className="mt-2 font-display text-2xl text-[#21464d]">Pre-therapy infection-exclusion review</h2><p className="mt-3 text-sm leading-6 text-[#557377]">The protected form now records chest imaging, tuberculin / IGRA TB screening, and varicella immunity (VZV immunoglobulin / serology) as protocol items with a status and research-safe note before relevant immune therapy. The treating team determines which screening or referral is appropriate; this demonstration does not offer treatment advice.</p><a href="/records/new" className="mt-6 inline-flex items-center rounded-md bg-[#17616c] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#104f58]">Open secure registry<ArrowRight className="ml-2 h-4 w-4" /></a></CardContent></Card>
        </section>
      </div>
    </main>
  );
}

function PreviewStep({ number, label }: { number: string; label: string }) { return <li className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#e7f5f0] text-xs font-bold text-[#28736a]">{number}</span>{label}</li>; }
function PreviewField({ label }: { label: string }) { return <div className="rounded-xl border border-[#e6eeeb] bg-[#fbfdfc] px-4 py-3 text-sm text-[#567075]">{label}</div>; }
export function SavedItemsBatchSkeleton({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null;
  return <div className="space-y-4" aria-hidden="true">{[0, 1].map((index) => <div key={index} className="overflow-hidden rounded-2xl border border-[#d9ebe5] bg-white shadow-sm"><Skeleton className="h-28 rounded-none bg-[#dcefe9] motion-reduce:animate-none" /><div className="space-y-3 p-5"><Skeleton className="h-3 w-24 rounded-full bg-[#dcefe9] motion-reduce:animate-none" /><Skeleton className="h-6 w-4/5 rounded-lg bg-[#e5f3ef] motion-reduce:animate-none" /><Skeleton className="h-4 w-full rounded-lg bg-[#edf7f4] motion-reduce:animate-none" /><Skeleton className="h-4 w-3/5 rounded-lg bg-[#edf7f4] motion-reduce:animate-none" /></div></div>)}</div>;
}
