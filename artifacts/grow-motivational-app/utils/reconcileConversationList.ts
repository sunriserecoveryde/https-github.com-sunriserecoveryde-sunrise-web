/**
 * Pure helpers for the conversation-list reconciliation logic that lives inside
 * the `loadConversations` and `goBackToList` paths of the Chat screen.
 *
 * Keeping them here (outside the component) makes them trivially unit-testable
 * without a React / React-Native render environment.
 */

export interface ConversationSummary {
  id: number;
  title: string;
  createdAt: string;
  lastMessagePreview?: string | null;
}

// ---------------------------------------------------------------------------
// reconcileConversationList
// ---------------------------------------------------------------------------

export interface ReconcileResult {
  /**
   * The final list to hand to setConversations.
   */
  baseList: ConversationSummary[];
  /**
   * When true the caller should clear optimisticBackConvRef (set it to null).
   * The ref must not be mutated here so the function stays pure and testable.
   */
  clearOptimistic: boolean;
}

/**
 * Given the server-sorted list, the current optimistic back-navigation entry,
 * and the current local state snapshot, return the final list and whether the
 * optimistic ref should be cleared.
 *
 * Three cases:
 *  1. Server confirmed the conversation → use server list, clear ref.
 *  2. Server missed it but it still lives in local state → pin it at the top.
 *  3. Absent from both server AND local state (deleted while backgrounded /
 *     force-quit during rename) → use server list, clear ref so the ghost
 *     entry is never re-injected on resume.
 */
export function reconcileConversationList(
  sorted: ConversationSummary[],
  optimisticBack: ConversationSummary | null,
  localConversations: ConversationSummary[]
): ReconcileResult {
  if (optimisticBack === null) {
    return { baseList: sorted, clearOptimistic: false };
  }

  if (sorted.some((c) => c.id === optimisticBack.id)) {
    // Case 1 — server confirmed it
    return { baseList: sorted, clearOptimistic: true };
  }

  if (localConversations.some((c) => c.id === optimisticBack.id)) {
    // Case 2 — transient race; keep pinned, do NOT clear yet
    return { baseList: [optimisticBack, ...sorted], clearOptimistic: false };
  }

  // Case 3 — ghost: absent from both. Clear the ref, do not inject.
  return { baseList: sorted, clearOptimistic: true };
}

// ---------------------------------------------------------------------------
// buildOptimisticBackEntry
// ---------------------------------------------------------------------------

/**
 * Build the optimistic ConversationSummary to inject when the user navigates
 * back to the list during / after a rename.  Returns null when the conversation
 * is no longer present in local state (already deleted) so the caller knows to
 * skip the injection entirely.
 *
 * @param activeConvId      The id of the conversation being left.
 * @param localConversations Current conversations array (snapshot).
 * @param pendingRenameTitle The in-flight rename title, if any.
 * @param confirmedTitle    The last server-confirmed or display title.
 * @param nowIso            ISO timestamp string (injected for testability).
 */
export function buildOptimisticBackEntry(
  activeConvId: number | null,
  localConversations: ConversationSummary[],
  pendingRenameTitle: string | null,
  confirmedTitle: string,
  nowIso: string
): ConversationSummary | null {
  if (activeConvId === null) return null;

  // Guard: if the conversation has already been removed from state (e.g.
  // deleted while a PATCH was in-flight and the app was backgrounded),
  // return null so the caller can skip the optimistic injection entirely.
  if (!localConversations.some((c) => c.id === activeConvId)) {
    return null;
  }

  const optimisticTitle = pendingRenameTitle ?? confirmedTitle;
  return {
    id: activeConvId,
    title: optimisticTitle,
    createdAt: nowIso,
  };
}
