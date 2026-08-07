#!/usr/bin/env bash
# build-sha256sums.sh — generate SHA256SUMS.txt for the v3 archive directory
# IMPORTANT: SHA256SUMS.txt is excluded from its own entries (self-referential
# checksum files are unverifiable). The manifest_entries count = total_files - 1.
#
# Usage:
#   ./build-sha256sums.sh <archive-directory>
#   Output: SHA256SUMS.txt written inside <archive-directory>

set -euo pipefail

ARCHIVE_DIR="${1:?Usage: $0 <archive-directory>}"
SHA_FILE="$ARCHIVE_DIR/SHA256SUMS.txt"

if [ ! -d "$ARCHIVE_DIR" ]; then
  echo "ERROR: Directory '$ARCHIVE_DIR' does not exist" >&2
  exit 1
fi

# Collect all files, sorted, excluding SHA256SUMS.txt itself
mapfile -t FILES < <(
  find "$ARCHIVE_DIR" -type f ! -name "SHA256SUMS.txt" \
    | sed "s|$ARCHIVE_DIR/||" \
    | sort
)

TOTAL_FILES=$(find "$ARCHIVE_DIR" -type f | wc -l)
MANIFEST_ENTRIES=${#FILES[@]}

echo "Archive directory:  $ARCHIVE_DIR"
echo "Total files:        $TOTAL_FILES"
echo "Manifest entries:   $MANIFEST_ENTRIES  (excludes SHA256SUMS.txt itself)"
echo "Writing:            $SHA_FILE"

# Write SHA256SUMS.txt (BSD sha256sum compatible — two-space separator)
{
  echo "# Phase 3 — Clinical Documentation Foundation"
  echo "# Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "# Manifest entries: $MANIFEST_ENTRIES (SHA256SUMS.txt excluded from its own entries)"
  echo "# Verify: sha256sum --check SHA256SUMS.txt"
  echo ""
  for rel in "${FILES[@]}"; do
    full="$ARCHIVE_DIR/$rel"
    hash=$(sha256sum "$full" | cut -d' ' -f1)
    # Use ASCII-only relative path with forward slashes
    echo "$hash  $rel"
  done
} > "$SHA_FILE"

echo "Done. $MANIFEST_ENTRIES entries written to SHA256SUMS.txt"
echo ""
echo "Verification:"
cd "$ARCHIVE_DIR" && sha256sum --check SHA256SUMS.txt 2>&1 | tail -5
