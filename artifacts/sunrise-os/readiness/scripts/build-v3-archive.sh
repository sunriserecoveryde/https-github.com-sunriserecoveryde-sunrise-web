#!/usr/bin/env bash
# build-v3-archive.sh — assemble the Phase 3 v3 review archive
#
# Prerequisites (must exist before running):
#   - Sequential test logs:      readiness/phase-3-final/logs/{api-vitest-A..D, sos-vitest-A..D, pw-A..C, combination}.txt
#   - Phase 2 upgrade proof log: readiness/phase-3-final/logs/phase-2-normal-runner-upgrade-proof.txt
#   - Sanitized traces:          readiness/phase-3-final/sanitized-traces/
#   - Sanitized HARs:            readiness/phase-3-final/sanitized-hars/
#   - Screenshots:               readiness/phase-3-final/screenshots/ (if any)
#   - Source snapshot:           readiness/phase-3-final/source-snapshot.txt
#
# Output:
#   readiness/phase-3-clinical-documentation-foundation-review-v3.zip

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
READINESS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
STAGING_DIR="/tmp/phase3-v3-staging"
ARCHIVE_NAME="phase-3-clinical-documentation-foundation-review-v3"
ARCHIVE_ZIP="$READINESS_DIR/${ARCHIVE_NAME}.zip"

echo "=== Phase 3 v3 Archive Builder ==="
echo "Staging: $STAGING_DIR"
echo "Archive: $ARCHIVE_ZIP"
echo ""

# Clean staging
rm -rf "$STAGING_DIR"
mkdir -p "$STAGING_DIR"

# ── 1. Sequential test logs ────────────────────────────────────────────────────
echo "Copying sequential test logs..."
mkdir -p "$STAGING_DIR/test-logs/sequential"
for step in api-vitest-A sos-vitest-A pw-A api-vitest-B sos-vitest-B pw-B \
            api-vitest-C sos-vitest-C pw-C api-vitest-D sos-vitest-D \
            rate-limiter-alone clinical-then-rate rate-then-clinical \
            pw-then-rate outbox-then-clinical clinical-then-outbox; do
  src="$READINESS_DIR/phase-3-final/logs/${step}.txt"
  if [ -f "$src" ]; then
    cp "$src" "$STAGING_DIR/test-logs/sequential/${step}.txt"
    echo "  ✓ $step"
  else
    echo "  ✗ MISSING: $step (required)"
  fi
done

# ── 2. Phase 2 upgrade proof ───────────────────────────────────────────────────
echo ""
echo "Copying Phase 2 upgrade proof..."
mkdir -p "$STAGING_DIR/phase-2-upgrade-proof"
cp "$READINESS_DIR/phase-3-final/logs/phase-2-normal-runner-upgrade-proof.txt" \
   "$STAGING_DIR/phase-2-upgrade-proof/"
echo "  ✓ phase-2-normal-runner-upgrade-proof.txt"

# ── 3. Sanitized traces ────────────────────────────────────────────────────────
echo ""
echo "Copying sanitized traces..."
if [ -d "$READINESS_DIR/phase-3-final/sanitized-traces" ]; then
  cp -r "$READINESS_DIR/phase-3-final/sanitized-traces" "$STAGING_DIR/browser-traces-sanitized"
  TRACE_COUNT=$(find "$STAGING_DIR/browser-traces-sanitized" -name "trace.zip" | wc -l)
  echo "  ✓ $TRACE_COUNT trace(s) copied"
else
  echo "  ✗ MISSING: sanitized-traces/ (required)"
fi

# ── 4. Sanitized HARs ─────────────────────────────────────────────────────────
echo ""
echo "Copying sanitized HAR files..."
if [ -d "$READINESS_DIR/phase-3-final/sanitized-hars" ]; then
  cp -r "$READINESS_DIR/phase-3-final/sanitized-hars" "$STAGING_DIR/browser-network-sanitized"
  HAR_COUNT=$(find "$STAGING_DIR/browser-network-sanitized" -name "*.har" | wc -l)
  echo "  ✓ $HAR_COUNT HAR(s) copied"
else
  mkdir -p "$STAGING_DIR/browser-network-sanitized"
  echo "  (no HAR files — traces only)"
fi

# ── 5. Source snapshot ─────────────────────────────────────────────────────────
echo ""
echo "Copying source snapshot..."
if [ -f "$READINESS_DIR/phase-3-final/source-snapshot.txt" ]; then
  cp "$READINESS_DIR/phase-3-final/source-snapshot.txt" "$STAGING_DIR/source-snapshot.txt"
  echo "  ✓ source-snapshot.txt"
else
  echo "  ✗ MISSING: source-snapshot.txt (required)"
fi

# ── 6. SHA256SUMS (excludes itself) ───────────────────────────────────────────
echo ""
echo "Generating SHA256SUMS.txt (excluding itself)..."
bash "$SCRIPT_DIR/build-sha256sums.sh" "$STAGING_DIR"

# ── 7. Pack the ZIP ───────────────────────────────────────────────────────────
echo ""
echo "Packing archive..."
(cd "$(dirname "$STAGING_DIR")" && zip -r "$ARCHIVE_ZIP" "$(basename "$STAGING_DIR")")
echo "Archive size: $(du -sh "$ARCHIVE_ZIP" | cut -f1)"

# ── 8. Verify the ZIP ─────────────────────────────────────────────────────────
echo ""
echo "Verifying archive integrity..."
unzip -t "$ARCHIVE_ZIP" | tail -3

echo ""
echo "=== Archive complete: $ARCHIVE_ZIP ==="
