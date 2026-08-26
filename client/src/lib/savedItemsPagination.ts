export const SAVED_ITEMS_PAGE_SIZE = 6;

export function nextVisibleSavedItemCount(currentCount: number, totalCount: number, pageSize = SAVED_ITEMS_PAGE_SIZE): number {
  return Math.min(totalCount, Math.max(0, currentCount) + pageSize);
}

export function visibleSavedItems<T>(items: readonly T[], visibleCount: number): T[] {
  return items.slice(0, Math.max(0, visibleCount));
}
