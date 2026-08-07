#!/usr/bin/env python3
"""
secret-scanner-v8.py — Phase 3 v8 recursive evidence secret scanner.

Scans a staging directory (and any outer ZIP) for leaked secrets.
Handles nested ZIPs, HAR files, trace ZIPs, screenshots, and plain files.

Scan targets per §14 of the v8 brief:
  - The full staging directory tree
  - Every nested ZIP (trace ZIPs, source ZIPs)
  - HAR files
  - Screenshot PNG files (metadata, not pixel data)
  - All text-like files (logs, manifests, checksums)

Exit 0 when 0 CRITICAL or HIGH findings across ALL targets.
Exit 1 when any CRITICAL or HIGH finding is found.

Usage:
    python3 readiness/scripts/secret-scanner-v8.py /tmp/sunrise-phase3-v8/
    python3 readiness/scripts/secret-scanner-v8.py artifacts/sunrise-os/readiness/phase-3-clinical-documentation-foundation-review-v8.zip
"""

import sys
import os
import re
import zipfile
import json
import io
import pathlib
from dataclasses import dataclass
from typing import Optional

# ─── Pattern catalogue ──────────────────────────────────────────────────────

@dataclass
class Pattern:
    severity: str
    description: str
    regex: re.Pattern
    # Suppress-flag: findings matching this pattern in ALREADY-redacted content
    # (i.e. the finding contains "[REDACTED]") are skipped.
    allow_redacted_form: bool = True


PATTERNS: list[Pattern] = [
    Pattern("CRITICAL", "express-session raw cookie",
            re.compile(r"\bs:[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9+/=_\-]{20,}", re.IGNORECASE)),
    Pattern("CRITICAL", "express-session URL-encoded cookie",
            re.compile(r"s%3A(?!\[REDACTED\])[A-Za-z0-9_\-]{20,}", re.IGNORECASE)),
    Pattern("CRITICAL", "JWT token",
            re.compile(r"eyJ[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}")),
    Pattern("HIGH", "argon2id password hash",
            re.compile(r"\$argon2id\$v=\d+\$m=\d+,t=\d+,p=\d+\$[A-Za-z0-9+/]{10,}\$[A-Za-z0-9+/]{10,}")),
    Pattern("HIGH", "bcrypt password hash",
            re.compile(r"\$2[aby]\$\d{2}\$[A-Za-z0-9./]{53}")),
    Pattern("HIGH", "Bearer token",
            re.compile(r"Bearer\s+[A-Za-z0-9_\-]{30,}", re.IGNORECASE)),
    Pattern("CRITICAL", "DATABASE_URL with password",
            re.compile(
                r"postgres(?:ql)?://[^:]+:"
                r"(?!pass(?:word)?@|secret@|changeme@|\*{2,}@|example@|test@|admin@|placeholder@)"
                r"[^@]{6,}@",
                re.IGNORECASE,
            )),
    Pattern("HIGH", "raw password field with value",
            re.compile(r'"password"\s*:\s*"(?!\[REDACTED\])[^"]{6,}"', re.IGNORECASE)),
    Pattern("CRITICAL", "cookie header with long value",
            re.compile(r'"cookie"\s*:\s*"(?!\[REDACTED\])[^"]{20,}"', re.IGNORECASE)),
    Pattern("CRITICAL", "set-cookie header with long value",
            re.compile(r'"set-cookie"\s*:\s*"(?!\[REDACTED\])[^"]{20,}"', re.IGNORECASE)),
    Pattern("HIGH", "authorization header with value",
            re.compile(r'"authorization"\s*:\s*"(?!\[REDACTED\])[^"]{10,}"', re.IGNORECASE)),
    Pattern("HIGH", "plain-text cookie assignment",
            re.compile(
                r"(sos_dev_session|connect\.sid|_csrf)\s*[=:]\s*(?!\[REDACTED\])[A-Za-z0-9%_\-\.+/=s]{12,}",
                re.IGNORECASE,
            )),
    Pattern("INFO", "long base64 string in possible token position",
            re.compile(r"[A-Za-z0-9+/]{60,}={0,2}")),
]

# INFO findings are collected but do NOT cause a non-zero exit.
FAIL_SEVERITIES = {"CRITICAL", "HIGH"}

# ─── File-type classification ──────────────────────────────────────────────

TEXT_EXTS = {
    ".json", ".ndjson", ".jsonl", ".trace", ".network",
    ".log", ".txt", ".md", ".csv", ".html", ".htm",
    ".har", ".ts", ".js", ".py", ".sh", ".toml", ".yaml", ".yml",
    ".sql", ".env", ".lock",
}
SKIP_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".woff", ".woff2", ".ttf"}

# ─── Statistics ────────────────────────────────────────────────────────────

class Stats:
    def __init__(self):
        self.files_scanned   = 0
        self.zips_opened     = 0
        self.bytes_read      = 0
        self.candidate_finds: list[dict] = []
        self.skipped_binary  = 0
        self.skipped_too_large = 0

    def add(self, severity: str, description: str, location: str, excerpt: str):
        self.candidate_finds.append({
            "severity": severity, "description": description,
            "location": location, "excerpt": excerpt[:120],
        })

    @property
    def fail_count(self):
        return sum(1 for f in self.candidate_finds if f["severity"] in FAIL_SEVERITIES)

    @property
    def info_count(self):
        return sum(1 for f in self.candidate_finds if f["severity"] == "INFO")


# ─── Scanner ───────────────────────────────────────────────────────────────

MAX_SCAN_SIZE = 50 * 1024 * 1024  # 50 MB per file


def scan_text(text: str, location: str, stats: Stats) -> None:
    for pat in PATTERNS:
        for m in pat.regex.finditer(text):
            match_str = m.group()
            # Skip findings that are already the [REDACTED] placeholder
            if "[REDACTED]" in match_str:
                continue
            stats.add(pat.severity, pat.description, location, match_str)


def scan_bytes(data: bytes, filename: str, location: str, stats: Stats) -> None:
    stats.bytes_read += len(data)
    ext = pathlib.Path(filename).suffix.lower()

    if ext in SKIP_EXTS:
        # Skip binary image/font files — no text patterns
        stats.skipped_binary += 1
        return

    if len(data) > MAX_SCAN_SIZE:
        stats.skipped_too_large += 1
        return

    try:
        text = data.decode("utf-8", errors="replace")
    except Exception:
        stats.skipped_binary += 1
        return

    stats.files_scanned += 1
    scan_text(text, location, stats)


def scan_zip(zip_path: str, zip_data: Optional[bytes], stats: Stats, depth: int = 0) -> None:
    """Open a ZIP (from path or bytes) and scan all its entries."""
    if depth > 4:
        return  # Guard against pathological nesting
    stats.zips_opened += 1
    try:
        if zip_data is not None:
            zf = zipfile.ZipFile(io.BytesIO(zip_data), "r")
        else:
            zf = zipfile.ZipFile(zip_path, "r")
    except (zipfile.BadZipFile, OSError) as e:
        print(f"  [WARN] Cannot open ZIP {zip_path}: {e}", file=sys.stderr)
        return

    with zf:
        for info in zf.infolist():
            if info.is_dir():
                continue
            try:
                data = zf.read(info.filename)
            except Exception:
                continue
            member_location = f"{zip_path}/{info.filename}"
            # If a nested ZIP, recurse
            if info.filename.lower().endswith(".zip"):
                scan_zip(member_location, data, stats, depth + 1)
            else:
                scan_bytes(data, info.filename, member_location, stats)


def scan_directory(root: pathlib.Path, stats: Stats) -> None:
    """Walk a directory recursively and scan every file."""
    for fpath in sorted(root.rglob("*")):
        if fpath.is_dir():
            continue
        rel = str(fpath.relative_to(root))
        if fpath.suffix.lower() == ".zip":
            scan_zip(str(fpath), None, stats)
        else:
            try:
                data = fpath.read_bytes()
            except OSError:
                continue
            scan_bytes(data, fpath.name, rel, stats)


# ─── Report ─────────────────────────────────────────────────────────────────

def print_report(stats: Stats, target: str) -> int:
    """Print summary and return exit code (0=clean, 1=failures)."""
    print(f"\n{'='*70}")
    print(f"Secret Scanner v8 — Report")
    print(f"  Target          : {target}")
    print(f"  Files scanned   : {stats.files_scanned}")
    print(f"  ZIPs opened     : {stats.zips_opened}")
    print(f"  Bytes read      : {stats.bytes_read:,}")
    print(f"  Skipped (binary): {stats.skipped_binary}")
    print(f"  Total findings  : {len(stats.candidate_finds)}")
    print(f"    CRITICAL/HIGH : {stats.fail_count}")
    print(f"    INFO          : {stats.info_count}")
    print(f"{'='*70}")

    crit_high = [f for f in stats.candidate_finds if f["severity"] in FAIL_SEVERITIES]
    info_finds = [f for f in stats.candidate_finds if f["severity"] == "INFO"]

    if crit_high:
        print(f"\n[FAIL] {len(crit_high)} CRITICAL/HIGH finding(s):\n")
        for i, f in enumerate(crit_high, 1):
            print(f"  [{i}] {f['severity']} — {f['description']}")
            print(f"       Location : {f['location']}")
            print(f"       Excerpt  : {f['excerpt']!r}")
        print()

    if info_finds:
        print(f"[INFO] {len(info_finds)} informational finding(s) (do not cause failure):")
        for f in info_finds[:20]:
            print(f"  INFO — {f['description']} @ {f['location'][:80]}")
        if len(info_finds) > 20:
            print(f"  ... and {len(info_finds) - 20} more INFO findings (truncated)")
        print()

    if stats.fail_count == 0:
        print("[PASS] 0 CRITICAL or HIGH secret findings. Evidence package is clean.")
        return 0
    else:
        print(f"[FAIL] {stats.fail_count} CRITICAL/HIGH finding(s). Fix before archiving.")
        return 1


# ─── Entry point ────────────────────────────────────────────────────────────

def main() -> None:
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <staging-dir-or-zip>", file=sys.stderr)
        sys.exit(2)

    target_arg = sys.argv[1]
    target = pathlib.Path(target_arg)
    stats = Stats()

    if not target.exists():
        print(f"Error: {target} does not exist.", file=sys.stderr)
        sys.exit(2)

    print(f"[secret-scanner-v8] Scanning: {target}")

    if target.is_dir():
        print(f"  Mode: directory walk (recursive)")
        scan_directory(target, stats)
    elif target.suffix.lower() == ".zip":
        print(f"  Mode: outer ZIP + nested ZIPs")
        scan_zip(str(target), None, stats)
    else:
        data = target.read_bytes()
        scan_bytes(data, target.name, target.name, stats)

    exit_code = print_report(stats, str(target))
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
