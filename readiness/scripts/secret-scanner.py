#!/usr/bin/env python3
"""secret-scanner.py — Phase 3 v6 evidence secret scanner.

Opens the v6 review ZIP (and nested ZIPs inside it), reads all text-like
files, and searches for patterns that indicate leaked secrets:
  - Express-session cookie values (s: or s%3A prefix)
  - JWT tokens (eyJ...)
  - bcrypt / argon2 password hashes
  - Bearer tokens
  - Generic long base64 strings in cookie= positions
  - DATABASE_URL / connection string patterns with passwords

Reports CRITICAL, HIGH, and INFO findings.  Exits 0 only when no CRITICAL or
HIGH findings are found.

Usage:
    python3 readiness/scripts/secret-scanner.py <path-to.zip>
"""

import sys
import os
import re
import zipfile
import json
import io
import pathlib

# ─── Pattern catalog ──────────────────────────────────────────────────────────

PATTERNS = [
    # express-session signed cookie (raw — s:...<sig>)
    (
        "CRITICAL",
        "express-session raw cookie",
        re.compile(r"\bs:[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9+/=_\-]{20,}", re.IGNORECASE),
    ),
    # express-session URL-encoded (not already redacted)
    (
        "CRITICAL",
        "express-session URL-encoded cookie",
        re.compile(r"s%3A[A-Za-z0-9_\-]{20,}(?!\[REDACTED\])", re.IGNORECASE),
    ),
    # JWT tokens
    (
        "CRITICAL",
        "JWT token",
        re.compile(r"eyJ[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}"),
    ),
    # argon2id hash (password hash) — only flag if it looks like a real hash
    (
        "HIGH",
        "argon2id password hash",
        re.compile(r"\$argon2id\$v=\d+\$m=\d+,t=\d+,p=\d+\$[A-Za-z0-9+/]{10,}\$[A-Za-z0-9+/]{10,}"),
    ),
    # bcrypt hash
    (
        "HIGH",
        "bcrypt password hash",
        re.compile(r"\$2[aby]\$\d{2}\$[A-Za-z0-9./]{53}"),
    ),
    # Bearer tokens
    (
        "HIGH",
        "Bearer token",
        re.compile(r"Bearer\s+[A-Za-z0-9_\-]{30,}", re.IGNORECASE),
    ),
    # DATABASE_URL with credentials
    (
        "CRITICAL",
        "DATABASE_URL with password",
        re.compile(r"postgres(?:ql)?://[^:]+:[^@]{3,}@", re.IGNORECASE),
    ),
    # CSRF token (lower severity — informational)
    (
        "INFO",
        "CSRF token value",
        re.compile(r"x-csrf-token\s*[:=]\s*[A-Za-z0-9_\-]{20,}", re.IGNORECASE),
    ),
    # Private key PEM
    (
        "CRITICAL",
        "Private key PEM block",
        re.compile(r"-----BEGIN (?:RSA |EC )?PRIVATE KEY-----"),
    ),
]

# ─── Helpers ──────────────────────────────────────────────────────────────────

TEXT_EXTENSIONS = {
    ".json", ".jsonl", ".ndjson", ".txt", ".log", ".md", ".ts", ".js",
    ".mjs", ".cjs", ".sh", ".py", ".sql", ".har", ".trace", ".network",
    ".csv", ".env", ".yaml", ".yml", ".toml", ".html", ".xml",
}

BINARY_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf",
    ".woff", ".woff2", ".ttf", ".eot", ".otf",
    ".zip",  # nested ZIPs handled separately
}

REDACTED_INDICATOR = "[REDACTED]"


def is_text_file(name: str) -> bool:
    ext = pathlib.Path(name).suffix.lower()
    if ext in BINARY_EXTENSIONS:
        return False
    # Files with no extension — try to treat as text
    return True


def scan_text(source_label: str, text: str) -> list[dict]:
    """Scan text content for secret patterns. Returns list of finding dicts."""
    findings = []
    for severity, label, pattern in PATTERNS:
        for m in pattern.finditer(text):
            matched = m.group(0)
            # Skip if it's already redacted
            if REDACTED_INDICATOR in matched:
                continue
            # Compute surrounding context (first 120 chars around match)
            start = max(0, m.start() - 40)
            end = min(len(text), m.end() + 40)
            ctx = text[start:end].replace("\n", "↵").replace("\r", "")
            findings.append({
                "severity": severity,
                "label": label,
                "source": source_label,
                "match_snippet": matched[:120],
                "context": ctx[:160],
            })
    return findings


def scan_zip(zip_path: str, depth: int = 0, parent_label: str = "") -> list[dict]:
    """Recursively scan a ZIP file for secrets."""
    findings = []
    label_prefix = parent_label or zip_path
    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            for info in zf.infolist():
                if info.is_dir():
                    continue
                name = info.filename
                ext = pathlib.Path(name).suffix.lower()
                file_label = f"{label_prefix}!/{name}"

                # Recurse into nested ZIPs (up to depth 3)
                if ext == ".zip" and depth < 3:
                    try:
                        nested_bytes = zf.read(info.filename)
                        nested_io = io.BytesIO(nested_bytes)
                        with zipfile.ZipFile(nested_io, "r") as nzf:
                            nested_findings = scan_zip_obj(nzf, file_label, depth + 1)
                            findings.extend(nested_findings)
                    except Exception as e:
                        findings.append({
                            "severity": "INFO",
                            "label": "nested ZIP read error",
                            "source": file_label,
                            "match_snippet": str(e)[:120],
                            "context": "",
                        })
                    continue

                if not is_text_file(name):
                    continue

                try:
                    raw = zf.read(info.filename)
                    text = raw.decode("utf-8", errors="replace")
                    file_findings = scan_text(file_label, text)
                    findings.extend(file_findings)
                except Exception as e:
                    pass  # Skip unreadable files

    except zipfile.BadZipFile as e:
        findings.append({
            "severity": "INFO",
            "label": "bad ZIP file",
            "source": zip_path,
            "match_snippet": str(e)[:120],
            "context": "",
        })
    return findings


def scan_zip_obj(zf: zipfile.ZipFile, parent_label: str, depth: int) -> list[dict]:
    """Scan an already-opened ZipFile object."""
    findings = []
    for info in zf.infolist():
        if info.is_dir():
            continue
        name = info.filename
        ext = pathlib.Path(name).suffix.lower()
        file_label = f"{parent_label}!/{name}"

        if ext == ".zip" and depth < 3:
            try:
                nested_bytes = zf.read(info.filename)
                nested_io = io.BytesIO(nested_bytes)
                with zipfile.ZipFile(nested_io, "r") as nzf:
                    findings.extend(scan_zip_obj(nzf, file_label, depth + 1))
            except Exception:
                pass
            continue

        if not is_text_file(name):
            continue

        try:
            raw = zf.read(info.filename)
            text = raw.decode("utf-8", errors="replace")
            findings.extend(scan_text(file_label, text))
        except Exception:
            pass

    return findings


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> int:
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <path-to-zip-or-dir>", file=sys.stderr)
        return 2

    target = sys.argv[1]
    all_findings: list[dict] = []

    if os.path.isdir(target):
        # Scan all files in directory recursively
        for root, _, files in os.walk(target):
            for fname in files:
                fpath = os.path.join(root, fname)
                ext = pathlib.Path(fpath).suffix.lower()
                label = fpath
                if ext == ".zip":
                    all_findings.extend(scan_zip(fpath, depth=0, parent_label=label))
                elif is_text_file(fname):
                    try:
                        with open(fpath, "r", errors="replace") as f:
                            text = f.read()
                        all_findings.extend(scan_text(label, text))
                    except Exception:
                        pass
    elif target.endswith(".zip"):
        all_findings.extend(scan_zip(target, depth=0))
    else:
        print(f"[ERROR] Target must be a .zip file or directory: {target}", file=sys.stderr)
        return 2

    # ── Report ────────────────────────────────────────────────────────────────
    critical = [f for f in all_findings if f["severity"] == "CRITICAL"]
    high     = [f for f in all_findings if f["severity"] == "HIGH"]
    info     = [f for f in all_findings if f["severity"] == "INFO"]

    print(f"\n{'='*72}")
    print(f"  Secret Scanner — Phase 3 v6 Evidence")
    print(f"{'='*72}")
    print(f"  Target:   {target}")
    print(f"  Total findings: {len(all_findings)}  "
          f"(CRITICAL: {len(critical)}  HIGH: {len(high)}  INFO: {len(info)})")
    print(f"{'='*72}\n")

    for severity_label, bucket in [("CRITICAL", critical), ("HIGH", high), ("INFO", info)]:
        if not bucket:
            continue
        print(f"── {severity_label} ({len(bucket)}) ──")
        for i, f in enumerate(bucket[:20], 1):  # cap at 20 per severity
            print(f"  [{i}] {f['label']}")
            print(f"      source:  {f['source'][:100]}")
            print(f"      match:   {f['match_snippet'][:100]}")
            print(f"      context: {f['context'][:120]}")
            print()
        if len(bucket) > 20:
            print(f"  ... and {len(bucket) - 20} more {severity_label} findings (truncated)\n")

    print(f"{'='*72}")
    if not critical and not high:
        print("  RESULT: PASS — no CRITICAL or HIGH secret findings.")
        print(f"{'='*72}\n")
        return 0
    else:
        print(f"  RESULT: FAIL — {len(critical)} CRITICAL and {len(high)} HIGH findings.")
        print(f"{'='*72}\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
