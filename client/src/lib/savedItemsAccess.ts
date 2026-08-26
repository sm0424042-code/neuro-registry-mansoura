export type SavedItemsClearUser = {
  role?: "admin" | "user" | null;
  accessStatus?: "approved" | "pending" | "suspended" | null;
} | null | undefined;

/** Only an approved administrator may use the protected bulk-clear control. */
export function canClearAllSavedItems(user: SavedItemsClearUser): boolean {
  return user?.role === "admin" && user.accessStatus === "approved";
}
