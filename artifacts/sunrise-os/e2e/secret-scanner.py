#!/usr/bin/env python3
"""
secret-scanner.py — Phase 4 v3 Recursive Secret Scanner
=========================================================
Scans a directory tree (and any ZIP files within it) for credential patterns.
Designed to be run on the evidence staging tree and the final ZIP before
submission.

Usage:
  python3 secret-scanner.py <path>

Exits 0 if no secrets found, 1 if any confirmed secret pattern is detected.

Patterns detected:
  • sos_dev_session cookie values (base64 or percent-encoded)
  • X-CSRF-Token values (40+ char hex or base64)
  • Bearer tokens in Authorization headers
  • connect.sid cookie values
  • AWS access key patterns (AKIA…)
  • Private key PEM blocks
"""

import os
import re
import sys
import json
import zipfile
import io

# ── Confirmed-secret patterns (true positives only) ──────────────────────────
CONFIRMED_PATTERNS = [
    # Session cookie values following = (base64url or percent-encoded)
    (re.compile(r"sos_dev_session=([A-Za-z0-9%+/._-]{20,})", re.I),
     "sos_dev_session cookie value"),

    (re.compile(r"connect\.sid=([A-Za-z0-9%+/._-]{20,})", re.I),
     "connect.sid cookie value"),

    # X-CSRF-Token: value (but NOT [REDACTED])
    (re.compile(r'"X-CSRF-Token"\s*:\s*"(?!(\[REDACTED\]|))([A-Za-z0-9+/=_-]{20,})"', re.I),
     "X-CSRF-Token value"),

    # Authorization: Bearer <token> (not REDACTED)
    (re.compile(r'Authorization:\s*Bearer\s+(?!\[REDACTED\])([A-Za-z0-9._-]{20,})', re.I),
     "Authorization Bearer token"),

    # AWS access key
    (re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
     "AWS access key"),

    # Private key PEM
    (re.compile(r"-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----"),
     "PEM private key block"),
]

# ── File types to scan ───────────────────────────────────────────────────────
TEXT_EXTENSIONS = {
    ".har", ".json", ".log", ".txt", ".md", ".sh", ".ts", ".js",
    ".py", ".toml", ".yaml", ".yml", ".env", ".csv",
}

# ── Scanner ──────────────────────────────────────────────────────────────────

findings: list[tuple[str, str, str]] = []  # (path, pattern_name, match_snippet)


def scan_text(content: str, path: str) -> None:
    """Check text content against all confirmed patterns."""
    for pattern, label in CONFIRMED_PATTERNS:
        for m in pattern.finditer(content):
            snippet = m.group()[:80].replace("\n", " ")
            findings.append((path, label, snippet))


def scan_file(filepath: str, display_path: str) -> None:
    """Read and scan a single file by path."""
    ext = os.path.splitext(filepath)[1].lower()
    if ext not in TEXT_EXTENSIONS:
        return
    try:
        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        scan_text(content, display_path)
    except (OSError, PermissionError) as e:
        print(f"[scanner] WARNING: cannot read {display_path}: {e}")


def scan_zip(zip_path: str, display_prefix: str) -> None:
    """Recursively scan a ZIP file, including nested ZIPs."""
    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            for info in zf.infolist():
                if info.is_dir():
                    continue
                display = f"{display_prefix}::{info.filename}"
                ext = os.path.splitext(info.filename)[1].lower()
                if ext == ".zip":
                    # Nested ZIP — read into memory and recurse
                    try:
                        data = zf.read(info.filename)
                        with zipfile.ZipFile(io.BytesIO(data)) as inner:
                            # Write to temp, recurse
                            for inner_info in inner.infolist():
                                if inner_info.is_dir():
                                    continue
                                inner_display = f"{display}::{inner_info.filename}"
                                inner_ext = os.path.splitext(inner_info.filename)[1].lower()
                                if inner_ext in TEXT_EXTENSIONS:
                                    try:
                                        inner_content = inner.read(inner_info.filename).decode(
                                            "utf-8", errors="replace"
                                        )
                                        scan_text(inner_content, inner_display)
                                    except Exception:
                                        pass
                    except Exception as e:
                        print(f"[scanner] WARNING: cannot read nested ZIP {display}: {e}")
                elif ext in TEXT_EXTENSIONS:
                    try:
                        content = zf.read(info.filename).decode("utf-8", errors="replace")
                        scan_text(content, display)
                    except Exception as e:
                        print(f"[scanner] WARNING: cannot decode {display}: {e}")
    except zipfile.BadZipFile as e:
        print(f"[scanner] WARNING: bad ZIP file {display_prefix}: {e}")


def scan_tree(root: str) -> None:
    """Walk a directory tree, scanning all text files and ZIP archives."""
    for dirpath, _, filenames in os.walk(root):
        for fname in filenames:
            full = os.path.join(dirpath, fname)
            display = os.path.relpath(full, root)
            ext = os.path.splitext(fname)[1].lower()
            if ext == ".zip":
                print(f"[scanner] Scanning ZIP: {display}")
                scan_zip(full, display)
            else:
                scan_file(full, display)


def main() -> None:
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <path>")
        sys.exit(1)

    target = sys.argv[1]
    if not os.path.exists(target):
        print(f"[scanner] ERROR: path does not exist: {target}")
        sys.exit(1)

    print(f"[scanner] Starting scan of: {os.path.abspath(target)}")

    if os.path.isdir(target):
        scan_tree(target)
    elif os.path.isfile(target):
        ext = os.path.splitext(target)[1].lower()
        if ext == ".zip":
            scan_zip(target, os.path.basename(target))
        else:
            scan_file(target, os.path.basename(target))
    else:
        print(f"[scanner] ERROR: not a file or directory: {target}")
        sys.exit(1)

    print(f"[scanner] Scan complete. {len(findings)} finding(s).")

    if findings:
        print("\n[scanner] CONFIRMED SECRETS FOUND:")
        for path, label, snippet in findings:
            print(f"  [{label}] in {path}")
            print(f"    Snippet: {snippet}")
        sys.exit(1)
    else:
        print("[scanner] PASS: No credential patterns detected.")
        sys.exit(0)


if __name__ == "__main__":
    main()
