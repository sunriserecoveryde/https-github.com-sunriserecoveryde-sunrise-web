/**
 * Unit tests for the conversation-list reconciliation helpers.
 *
 * These cover the two key guards introduced to prevent ghost entries after a
 * force-quit during a rename:
 *
 *  1. reconcileConversationList — called inside loadConversations when the
 *     server reply arrives; decides whether the optimistic back-navigation
 *     entry should be kept, pinned, or dropped.
 *
 *  2. buildOptimisticBackEntry — called inside goBackToList; decides whether
 *     the conversation is still present in local state before injecting an
 *     optimistic entry at all.
 *
 * The critical scenario (Task 459 / Task 457):
 *   - User opens a conversation and starts a rename (PATCH in-flight).
 *   - App is force-quit / sent to background.
 *   - The conversation is deleted from another session while the app is away.
 *   - App resumes → goBackToList fires, then loadConversations reconciles the
 *     server response.
 *   - The ghost entry (the just-renamed conversation) must NEVER appear in the
 *     conversations state.
 */

import {
  reconcileConversationList,
  buildOptimisticBackEntry,
  ConversationSummary,
} from "../reconcileConversationList";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function conv(id: number, title = "Conv " + id): ConversationSummary {
  return { id, title, createdAt: "2026-07-25T10:00:00.000Z" };
}

// ---------------------------------------------------------------------------
// reconcileConversationList
// ---------------------------------------------------------------------------

describe("reconcileConversationList", () => {
  // ----- no optimistic entry -----------------------------------------------

  it("returns the server list unchanged when optimisticBack is null", () => {
    const sorted = [conv(1), conv(2)];
    const { baseList, clearOptimistic } = reconcileConversationList(
      sorted,
      null,
      []
    );
    expect(baseList).toEqual(sorted);
    expect(clearOptimistic).toBe(false);
  });

  // ----- case 1: server confirmed -------------------------------------------

  it("clears the optimistic ref when the server list contains the conversation", () => {
    const sorted = [conv(42), conv(1)];
    const optimisticBack = conv(42, "My renamed conv");
    const { baseList, clearOptimistic } = reconcileConversationList(
      sorted,
      optimisticBack,
      [conv(42)]
    );
    // Server data is used as-is (no duplication)
    expect(baseList).toEqual(sorted);
    expect(clearOptimistic).toBe(true);
  });

  // ----- case 2: transient race (still in local state) ----------------------

  it("pins the optimistic entry at the top when the server missed it but local state still has it", () => {
    const sorted = [conv(1), conv(2)];
    const optimisticBack = conv(99, "Pinned conv");
    const local = [conv(99), conv(1), conv(2)];

    const { baseList, clearOptimistic } = reconcileConversationList(
      sorted,
      optimisticBack,
      local
    );

    expect(baseList[0]).toEqual(optimisticBack);
    expect(baseList).toHaveLength(sorted.length + 1);
    expect(clearOptimistic).toBe(false); // keep the ref — still racing
  });

  // ----- case 3: ghost scenario (the important one) -------------------------

  it("does NOT inject the optimistic entry when the conversation is absent from both the server list and local state", () => {
    // This is the force-quit-during-rename scenario:
    // • optimisticBackConvRef holds the conversation that was being renamed
    // • the conversation has since been deleted → missing from server response
    // • it is also absent from local state (e.g. purged by another session or
    //   because the component remounted fresh after a force-quit)
    const sorted = [conv(1), conv(2)]; // server returned, no conv 99
    const optimisticBack = conv(99, "Renamed but deleted");
    const local: ConversationSummary[] = []; // empty local state after cold-start

    const { baseList, clearOptimistic } = reconcileConversationList(
      sorted,
      optimisticBack,
      local
    );

    // Ghost must not appear
    expect(baseList).not.toContainEqual(expect.objectContaining({ id: 99 }));
    expect(baseList).toEqual(sorted);
    // Ref must be cleared so subsequent reloads don't re-inject it
    expect(clearOptimistic).toBe(true);
  });

  it("does NOT inject the ghost even when local state has other conversations", () => {
    // Variant: local state has some conversations but NOT the deleted one
    const sorted = [conv(1), conv(2)];
    const optimisticBack = conv(99, "Renamed but deleted");
    const local = [conv(1), conv(2)]; // conv 99 absent

    const { baseList, clearOptimistic } = reconcileConversationList(
      sorted,
      optimisticBack,
      local
    );

    expect(baseList).not.toContainEqual(expect.objectContaining({ id: 99 }));
    expect(clearOptimistic).toBe(true);
  });

  it("returns the server list unmodified in the ghost case (no duplication or reordering)", () => {
    const sorted = [conv(3), conv(1), conv(2)];
    const { baseList } = reconcileConversationList(
      sorted,
      conv(99, "ghost"),
      []
    );
    expect(baseList).toStrictEqual(sorted);
  });
});

// ---------------------------------------------------------------------------
// buildOptimisticBackEntry
// ---------------------------------------------------------------------------

describe("buildOptimisticBackEntry", () => {
  const NOW = "2026-07-25T12:00:00.000Z";

  it("returns null when activeConvId is null", () => {
    const result = buildOptimisticBackEntry(null, [conv(1)], null, "Title", NOW);
    expect(result).toBeNull();
  });

  // ----- ghost guard in goBackToList ----------------------------------------

  it("returns null when the conversation is absent from local state (already deleted)", () => {
    // Force-quit scenario: the conversation was deleted while the app was away.
    // When the component remounts / goBackToList fires, the conversation is
    // gone from local state.  The entry must not be injected.
    const local: ConversationSummary[] = [conv(1), conv(2)]; // no conv 99
    const result = buildOptimisticBackEntry(99, local, "New name", "Old name", NOW);
    expect(result).toBeNull();
  });

  // ----- normal back-navigation ---------------------------------------------

  it("returns an entry with the pending rename title when a rename is in-flight", () => {
    const local = [conv(42), conv(1)];
    const result = buildOptimisticBackEntry(
      42,
      local,
      "User-typed new name",
      "Original title",
      NOW
    );
    expect(result).not.toBeNull();
    expect(result!.id).toBe(42);
    expect(result!.title).toBe("User-typed new name");
    expect(result!.createdAt).toBe(NOW);
  });

  it("falls back to the confirmed title when no rename is pending", () => {
    const local = [conv(42)];
    const result = buildOptimisticBackEntry(42, local, null, "Confirmed title", NOW);
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Confirmed title");
  });

  it("prefers a non-empty pending rename title over the confirmed title", () => {
    const local = [conv(5)];
    const result = buildOptimisticBackEntry(5, local, "Draft title", "Server title", NOW);
    expect(result!.title).toBe("Draft title");
  });

  // ----- combined scenario: goBackToList then loadConversations reconcile ----

  it("full ghost scenario: goBackToList produces null → loadConversations gets no optimistic entry → no ghost in final list", () => {
    // Step 1 — goBackToList fires after a force-quit restart.
    // The conversation was deleted while the app was backgrounded,
    // so it is absent from local state on the fresh cold-start.
    const localOnResume: ConversationSummary[] = []; // empty after force-quit
    const optimisticEntry = buildOptimisticBackEntry(
      99,
      localOnResume,
      "Rename in-flight",
      "Old title",
      NOW
    );
    // goBackToList guard fires — no entry injected
    expect(optimisticEntry).toBeNull();

    // Step 2 — loadConversations reconciles the server response.
    // Since goBackToList produced null, optimisticBackConvRef was never set.
    const serverList = [conv(1), conv(2)]; // conv 99 absent
    const { baseList, clearOptimistic } = reconcileConversationList(
      serverList,
      null, // optimisticBackConvRef.current was never set
      localOnResume
    );

    // Final assertion: ghost must not appear
    expect(baseList).not.toContainEqual(expect.objectContaining({ id: 99 }));
    expect(baseList).toEqual(serverList);
    expect(clearOptimistic).toBe(false);
  });

  it("full ghost scenario: ref set before force-quit → loadConversations clears it and omits ghost", () => {
    // Alternative path: the ref was set just before the force-quit so it
    // persists in memory (simulated by passing it explicitly), but the
    // conversation has been deleted while the app was backgrounded.
    const serverList = [conv(1), conv(2)];
    const staleOptimisticRef = conv(99, "Rename in-flight");
    const localOnResume: ConversationSummary[] = []; // cold start — no local state

    const { baseList, clearOptimistic } = reconcileConversationList(
      serverList,
      staleOptimisticRef,
      localOnResume
    );

    expect(baseList).not.toContainEqual(expect.objectContaining({ id: 99 }));
    expect(baseList).toEqual(serverList);
    expect(clearOptimistic).toBe(true); // caller must null out the ref
  });
});

// ---------------------------------------------------------------------------
// Two rapid back-navigations — interleaved loadConversations responses
// ---------------------------------------------------------------------------

describe("two rapid back-navigations (interleaved scenario)", () => {
  /**
   * Sequence under test:
   *   1. User opens conv A → presses back  (optimisticBackConvRef = entryA)
   *      loadConversations request #1 starts but hasn't resolved yet.
   *   2. User opens conv B → presses back quickly before #1 resolves
   *      (optimisticBackConvRef is overwritten with entryB)
   *      loadConversations request #2 starts.
   *   3. Response #1 arrives — reconcileConversationList runs with entryB as
   *      the current ref (entryA's ref has already been overwritten).
   *   4. Response #2 arrives — reconcileConversationList runs again.
   *
   * Invariant: the final conversations list must contain exactly one entry per id.
   */
  const NOW = "2026-07-25T14:00:00.000Z";

  it("no duplicates when both back-navigations complete before either loadConversations resolves", () => {
    // Baseline data: three conversations on the server.
    const serverResponse = [conv(1), conv(2), conv(3)];

    // ── Step 1: user is in conv 1, presses back ──────────────────────────────
    const localAfterOpenA = [conv(1), conv(2), conv(3)];
    const entryA = buildOptimisticBackEntry(1, localAfterOpenA, null, "Conv 1", NOW);
    expect(entryA).not.toBeNull(); // sanity: entry was built

    // Simulate caller injecting optimistic entry at top of local state.
    // optimisticBackConvRef is now entryA.
    let optimisticRef: ConversationSummary | null = entryA;
    const localAfterBackA = [entryA!, conv(2), conv(3)];

    // ── Step 2: user opens conv 2, presses back quickly ──────────────────────
    // entryA is still in local state (the reload from step 1 hasn't finished).
    const entryB = buildOptimisticBackEntry(2, localAfterBackA, null, "Conv 2", NOW);
    expect(entryB).not.toBeNull();

    // Ref is overwritten — entryA is now orphaned.
    optimisticRef = entryB;
    const localAfterBackB = [entryB!, entryA!, conv(3)];

    // ── Step 3: loadConversations response #1 arrives ────────────────────────
    // optimisticRef is still entryB (ref was overwritten in step 2).
    const result1 = reconcileConversationList(
      serverResponse,
      optimisticRef,
      localAfterBackB
    );

    // conv 2 (entryB's id) IS in the server response → ref is cleared.
    expect(result1.clearOptimistic).toBe(true);
    if (result1.clearOptimistic) {
      optimisticRef = null;
    }

    // After step 3 the list should already have no duplicates.
    const ids1 = result1.baseList.map((c) => c.id);
    expect(ids1).toHaveLength(new Set(ids1).size);

    // ── Step 4: loadConversations response #2 arrives ────────────────────────
    // optimisticRef was cleared in step 3; response is the same server data.
    const result2 = reconcileConversationList(
      serverResponse,
      optimisticRef,
      result1.baseList
    );

    // Final invariant: exactly one entry per id, no ghost entries.
    const finalIds = result2.baseList.map((c) => c.id);
    expect(finalIds).toHaveLength(new Set(finalIds).size);
    expect(result2.baseList).toHaveLength(serverResponse.length);
    // Both conv 1 and conv 2 are present exactly once.
    expect(finalIds.filter((id) => id === 1)).toHaveLength(1);
    expect(finalIds.filter((id) => id === 2)).toHaveLength(1);
    expect(finalIds.filter((id) => id === 3)).toHaveLength(1);
  });

  it("no duplicates when response #1 arrives before the second back-navigation fires", () => {
    // Variant: the first loadConversations resolves before the user opens conv B.
    const serverResponse = [conv(1), conv(2), conv(3)];

    // Step 1: back from conv 1.
    const localStart = [conv(1), conv(2), conv(3)];
    const entryA = buildOptimisticBackEntry(1, localStart, null, "Conv 1", NOW)!;
    let optimisticRef: ConversationSummary | null = entryA;
    const localAfterBackA = [entryA, conv(2), conv(3)];

    // Step 2: response #1 arrives — conv 1 confirmed by server.
    const result1 = reconcileConversationList(
      serverResponse,
      optimisticRef,
      localAfterBackA
    );
    expect(result1.clearOptimistic).toBe(true);
    if (result1.clearOptimistic) optimisticRef = null;

    // Step 3: user opens conv 2 and immediately presses back.
    const entryB = buildOptimisticBackEntry(2, result1.baseList, null, "Conv 2", NOW)!;
    optimisticRef = entryB;
    const localAfterBackB = [entryB, ...result1.baseList.filter((c) => c.id !== 2)];

    // Step 4: response #2 arrives — conv 2 confirmed.
    const result2 = reconcileConversationList(
      serverResponse,
      optimisticRef,
      localAfterBackB
    );

    const finalIds = result2.baseList.map((c) => c.id);
    expect(finalIds).toHaveLength(new Set(finalIds).size);
    expect(result2.baseList).toHaveLength(serverResponse.length);
  });

  it("second optimistic ref overwrites first — orphaned first ref never re-appears", () => {
    // The orphaned entryA ref (conv 1) must not resurface at any point.
    // If the caller had two separate refs, conv 1 could be injected twice.
    // This test confirms a single-ref design is sufficient.
    const serverResponse = [conv(1), conv(2), conv(3)];
    const NOW2 = "2026-07-25T14:05:00.000Z";

    const localStart = [conv(1), conv(2), conv(3)];

    // Back from conv 1 — ref is entryA.
    const entryA = buildOptimisticBackEntry(1, localStart, "Draft A", "Conv 1", NOW)!;
    // Back from conv 2 — ref is overwritten with entryB.
    const localWithA = [entryA, conv(2), conv(3)];
    const entryB = buildOptimisticBackEntry(2, localWithA, null, "Conv 2", NOW2)!;

    // Only entryB (the latest ref) is passed to reconcileConversationList.
    const { baseList, clearOptimistic } = reconcileConversationList(
      serverResponse,
      entryB, // entryA is already orphaned
      localWithA
    );

    // conv 2 is confirmed by server → ref cleared.
    expect(clearOptimistic).toBe(true);

    // conv 1 must appear exactly once (from the server list).
    const ids = baseList.map((c) => c.id);
    expect(ids.filter((id) => id === 1)).toHaveLength(1);
    expect(ids.filter((id) => id === 2)).toHaveLength(1);
    // No ghost / no duplication.
    expect(ids).toHaveLength(new Set(ids).size);
  });
});
