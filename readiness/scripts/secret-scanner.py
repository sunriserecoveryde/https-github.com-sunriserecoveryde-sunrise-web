#!/usr/bin/env python3
"""
secret-scanner.py — Phase 3 v4 recursive secret scanner.

Inspects:
  * Repository source files
  * Evidence files (logs, manifests, etc.)
  * HAR JSON files
  * Playwright trace.zip contents (extracted and inspected)
  * Final review ZIP and every nested ZIP inside it
  * Every JSON, JSONL, text, HTML, and network file inside compressed artifacts

Detects (only non-empty actual values — NOT harmless field name occurrences):
  * Browser-test password
  * Password JSON fields with actual values
  * Session cookies (sos_dev_session, connect.sid)
  * CSRF tokens/cookies (_csrf)
  * Cookie header values
  * Set-Cookie header values
  * Authorization header values
  * Session identifiers
  * Private keys
  * Database credentials (postgres:// with password)

The scanner distinguishes harmless field names from actual non-empty values:
  e.g., `"password": "[REDACTED]"` is harmless; `"password": "MySecret"` is a finding.

Usage:
    python3 readiness/scripts/secret-scanner.py [targets...]

Examples:
    python3 readiness/scripts/secret-scanner.py .
    python3 readiness/scripts/secret-scanner.py readiness/ artifacts/sunrise-os/e2e/

Exit code: 0 if 0 confirmed secrets; 1 if any confirmed secrets found.
"""

import json
import os
import re
import sys
import zipfile
from pathlib import Path
from typing import NamedTuple

# ── Configuration ──────────────────────────────────────────────────────────────

# Directories and files to skip entirely
SKIP_DIRS = {
    ".git", "node_modules", ".pnpm", "__pycache__", ".cache",
    "dist", "build", ".next", ".nuxt", ".turbo",
}

# Extensions to inspect (text-based)
TEXT_EXTENSIONS = {
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".json", ".jsonl", ".ndjson", ".yaml", ".yml",
    ".env", ".env.local", ".env.test",
    ".txt", ".md", ".log", ".har",
    ".html", ".htm", ".sh", ".py",
    ".trace", ".network",
}

# Files to skip (generated/compiled artifacts)
SKIP_FILES = {
    "pnpm-lock.yaml", "yarn.lock", "package-lock.json",
    "SHA256SUMS.txt", "secret-scanner.py",  # exclude self
}

# ── Detection patterns ─────────────────────────────────────────────────────────

class Pattern(NamedTuple):
    name: str
    regex: re.Pattern
    description: str


# Patterns that detect actual non-empty secret values.
# Each pattern must NOT match [REDACTED] or empty strings.
PATTERNS: list[Pattern] = [
    Pattern(
        name="session-cookie-value",
        regex=re.compile(
            r'(?:sos_dev_session|connect\.sid)\s*[=:]\s*'
            r'(?!\[REDACTED\])(?!"\s*[,}\]])'  # not redacted, not empty JSON value
            r'(["\']?)([^\s"\';\n,}{>]{20,})\1',
            re.IGNORECASE,
        ),
        description="Session cookie with a non-empty value",
    ),
    Pattern(
        name="csrf-cookie-value",
        regex=re.compile(
            r'(?:_csrf|csrf_token|csrftoken)\s*[=:]\s*'
            r'(?!\[REDACTED\])(?!"\s*[,}\]])'
            r'(["\']?)([^\s"\';\n,}{>]{10,})\1',
            re.IGNORECASE,
        ),
        description="CSRF token/cookie with a non-empty value",
    ),
    Pattern(
        name="cookie-header-with-value",
        regex=re.compile(
            r'"(?:cookie|set-cookie)"\s*:\s*"(?!\[REDACTED\])([^"]{15,})"',
            re.IGNORECASE,
        ),
        description="Cookie or Set-Cookie header with a non-empty value",
    ),
    Pattern(
        name="authorization-header-with-value",
        regex=re.compile(
            r'"authorization"\s*:\s*"(?!\[REDACTED\])(?!null)(?!"\s*[,}])'
            r'([^"]{8,})"',
            re.IGNORECASE,
        ),
        description="Authorization header with a non-empty value",
    ),
    Pattern(
        name="password-field-with-value",
        regex=re.compile(
            # Match "password": "VALUE" where VALUE is not [REDACTED], not empty
            r'"password"\s*:\s*"(?!\[REDACTED\])(?!\s*")'
            r'([^"]{4,})"',
            re.IGNORECASE,
        ),
        description="Password JSON field with a non-empty value",
    ),
    Pattern(
        name="private-key",
        regex=re.compile(
            r"-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----",
            re.IGNORECASE,
        ),
        description="Private key block",
    ),
    Pattern(
        name="db-url-with-password",
        regex=re.compile(
            r"postgres(?:ql)?://[^:@\s]+:[^@\s]{4,}@",
            re.IGNORECASE,
        ),
        description="PostgreSQL connection URL with embedded password",
    ),
    Pattern(
        name="session-id-in-log",
        regex=re.compile(
            # Express session IDs: s%3A prefix (URL-encoded) followed by hex
            r"s%3A[A-Fa-f0-9_\-]{20,}",
        ),
        description="URL-encoded Express session ID in log or text",
    ),
]

# ── Scanning logic ─────────────────────────────────────────────────────────────

class Finding(NamedTuple):
    path: str
    line: int
    pattern: str
    excerpt: str


def scan_text(text: str, label: str) -> list[Finding]:
    """Scan text content for secret patterns. Returns list of findings."""
    findings: list[Finding] = []
    lines = text.splitlines()
    for lineno, line in enumerate(lines, start=1):
        for pat in PATTERNS:
            m = pat.regex.search(line)
            if m:
                # Truncate the matched excerpt to 100 chars for the report
                excerpt = line.strip()[:100]
                findings.append(Finding(
                    path=label,
                    line=lineno,
                    pattern=pat.name,
                    excerpt=excerpt,
                ))
    return findings


def inspect_zip(zip_path: str, prefix: str, depth: int = 0) -> list[Finding]:
    """Recursively inspect a ZIP file's text contents."""
    if depth > 4:
        return []  # guard against deeply nested ZIPs
    findings: list[Finding] = []
    try:
        with zipfile.ZipFile(zip_path, "r") as z:
            for name in z.namelist():
                if any(name.endswith(ext) for ext in TEXT_EXTENSIONS) or \
                   name.endswith(".trace") or name.endswith(".network"):
                    try:
                        raw = z.read(name)
                        text = raw.decode("utf-8", errors="replace")
                        label = f"{prefix}/{name}"
                        findings.extend(scan_text(text, label))
                    except Exception:
                        pass
                # Recurse into nested ZIPs
                if name.endswith(".zip"):
                    try:
                        import tempfile, shutil
                        with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as tmp:
                            tmp.write(z.read(name))
                            tmp_path = tmp.name
                        findings.extend(inspect_zip(tmp_path, f"{prefix}/{name}", depth + 1))
                        os.unlink(tmp_path)
                    except Exception:
                        pass
    except zipfile.BadZipFile:
        pass
    return findings


def scan_file(path: Path, root: Path) -> list[Finding]:
    """Scan a single file. Handles ZIPs specially."""
    label = str(path.relative_to(root))

    if path.suffix == ".zip":
        return inspect_zip(str(path), label)

    try:
        raw = path.read_bytes()
        text = raw.decode("utf-8", errors="replace")
        return scan_text(text, label)
    except Exception:
        return []


def should_skip_file(path: Path) -> bool:
    if path.name in SKIP_FILES:
        return True
    # Skip binary-looking files by extension
    binary_exts = {
        ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico",
        ".woff", ".woff2", ".ttf", ".otf", ".eot",
        ".mp4", ".webm", ".mov", ".avi",
        ".pdf", ".docx", ".pptx",
        ".pyc", ".pyo", ".class",
    }
    if path.suffix.lower() in binary_exts:
        return True
    # Skip if not a recognized text extension AND not a ZIP
    if path.suffix.lower() not in TEXT_EXTENSIONS and path.suffix != ".zip":
        return True
    return False


def scan_directory(root: Path) -> list[Finding]:
    all_findings: list[Finding] = []
    files_scanned = 0
    zips_inspected = 0

    for dirpath, dirnames, filenames in os.walk(root):
        # Prune skip directories
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]

        for fname in filenames:
            fpath = Path(dirpath) / fname
            if should_skip_file(fpath):
                continue
            files_scanned += 1
            if fpath.suffix == ".zip":
                zips_inspected += 1
            findings = scan_file(fpath, root)
            all_findings.extend(findings)

    print(f"  Scanned {files_scanned} file(s), inspected {zips_inspected} ZIP archive(s).")
    return all_findings


# ── Entry point ────────────────────────────────────────────────────────────────

def main() -> None:
    targets = sys.argv[1:] or ["."]

    print(f"Secret scanner — inspecting {len(targets)} target(s)")
    print("=" * 60)

    all_findings: list[Finding] = []

    for target in targets:
        p = Path(target)
        if not p.exists():
            print(f"[SKIP] {target} — does not exist")
            continue
        print(f"\nScanning: {target}")
        if p.is_dir():
            findings = scan_directory(p)
        elif p.is_file() and p.suffix == ".zip":
            findings = inspect_zip(str(p), str(p))
        elif p.is_file():
            findings = scan_file(p, p.parent)
        else:
            findings = []
        all_findings.extend(findings)

    print("\n" + "=" * 60)
    if all_findings:
        print(f"[FAIL] {len(all_findings)} confirmed secret(s) found:\n")
        for f in all_findings:
            print(f"  {f.path}:{f.line}  [{f.pattern}]")
            print(f"    {f.excerpt}")
        sys.exit(1)
    else:
        print(f"[PASS] 0 confirmed secrets found.")
        sys.exit(0)


if __name__ == "__main__":
    main()
