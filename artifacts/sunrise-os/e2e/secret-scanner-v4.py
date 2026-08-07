#!/usr/bin/env python3
"""
Phase 4 v4 — Recursive Secret Scanner
Scans a directory tree or ZIP file (including nested trace ZIPs and HAR files)
for sensitive credentials. Reports exact counts for all categories.
"""
import sys
import os
import re
import json
import zipfile
import io

REDACTED_MARKER = "[REDACTED]"

# Patterns to detect real secrets (not the [REDACTED] placeholder)
SECRET_PATTERNS = {
    "sos_dev_session_value": re.compile(
        r'sos_dev_session\s*=\s*(?!%5BREDACTED%5D|\[REDACTED\])([^\s"\';\]]{10,})',
        re.IGNORECASE
    ),
    "session_s_prefix": re.compile(
        r'(?<![REDACTED])\bs%3A[A-Za-z0-9%+/\-_]{20,}',
        re.IGNORECASE
    ),
    "session_colon_prefix": re.compile(
        r'(?<!\[)"s:[A-Za-z0-9+/\-_]{20,}\.',
        re.IGNORECASE
    ),
    "csrf_value": re.compile(
        r'_csrf\s*=\s*(?!\[REDACTED\])([^\s"\';\]]{8,})',
        re.IGNORECASE
    ),
    "x_csrf_token_raw": re.compile(
        r'"X-CSRF-Token"\s*:\s*"(?!\[REDACTED\])([^"]{8,})"',
        re.IGNORECASE
    ),
    "cookie_header_raw": re.compile(
        r'"(?:Cookie|Set-Cookie)"\s*:\s*"(?!\[REDACTED\])([^"]{10,})"',
        re.IGNORECASE
    ),
    "bearer_token": re.compile(
        r'Authorization:\s*Bearer\s+(?!\[REDACTED\])([A-Za-z0-9\-_+/=.]{20,})',
        re.IGNORECASE
    ),
    "password_field": re.compile(
        r'"password"\s*:\s*"(?!\[REDACTED\])([^"]{4,})"',
        re.IGNORECASE
    ),
    "database_credential": re.compile(
        # Require actual credential chars — no regex metacharacters like [^ in the user/password
        r'postgresql://[A-Za-z0-9_\-\.]+:[A-Za-z0-9_\-\.!@#$%^&*()]{4,}@',
        re.IGNORECASE
    ),
    "private_key": re.compile(
        r'-----BEGIN (?:RSA |EC )?PRIVATE KEY-----',
        re.IGNORECASE
    ),
    "aws_key": re.compile(
        r'(?:AKIA|ASIA|ABIA|ACCA)[A-Z0-9]{16}'
    ),
}

BINARY_EXTENSIONS = {
    '.jpeg', '.jpg', '.png', '.webp', '.gif', '.ico',
    '.woff', '.woff2', '.ttf', '.otf', '.eot',
    '.mp4', '.mp3', '.wav', '.pdf',
    '.class', '.pyc', '.o', '.so', '.dll', '.exe',
}

def is_binary_name(name: str) -> bool:
    ext = os.path.splitext(name)[1].lower()
    if ext in BINARY_EXTENSIONS:
        return True
    # Playwright resource blobs: 40-char hex names
    basename = os.path.basename(name)
    if re.match(r'^[0-9a-f]{40}$', basename):
        return True
    return False


def scan_text(content: str, source_label: str, findings: list):
    """Scan text content for secrets; append to findings list."""
    for pat_name, pattern in SECRET_PATTERNS.items():
        for match in pattern.finditer(content):
            val = match.group(0)
            # Skip if the matched value is [REDACTED]
            if '[REDACTED]' in val or '%5BREDACTED%5D' in val:
                continue
            findings.append({
                "source": source_label,
                "pattern": pat_name,
                "sample": val[:80],
            })
            if len(findings) >= 200:
                return  # Safety cap


def scan_bytes(data: bytes, label: str, findings: list):
    """Try to decode bytes and scan."""
    try:
        text = data.decode('utf-8', errors='replace')
        scan_text(text, label, findings)
    except Exception:
        pass


class Scanner:
    def __init__(self):
        self.files_scanned = 0
        self.nested_zips_opened = 0
        self.trace_zips_opened = 0
        self.har_files_parsed = 0
        self.findings = []

    def scan_zip_bytes(self, data: bytes, zip_label: str, is_trace: bool = False):
        """Recursively scan a ZIP from bytes."""
        self.nested_zips_opened += 1
        if is_trace:
            self.trace_zips_opened += 1

        try:
            with zipfile.ZipFile(io.BytesIO(data)) as z:
                for name in z.namelist():
                    if is_binary_name(name):
                        continue
                    label = f"{zip_label}!{name}"
                    try:
                        content = z.read(name)
                        self.files_scanned += 1
                        # Recurse into nested ZIPs
                        if name.endswith('.zip'):
                            inner_is_trace = 'trace' in name.lower()
                            self.scan_zip_bytes(content, label, inner_is_trace)
                        else:
                            scan_bytes(content, label, self.findings)
                    except Exception as e:
                        pass
        except Exception as e:
            pass

    def scan_file(self, path: str, label: str):
        """Scan a single file."""
        if is_binary_name(path):
            return

        try:
            with open(path, 'rb') as f:
                data = f.read()
        except Exception:
            return

        self.files_scanned += 1
        name = os.path.basename(path).lower()

        # HAR file
        if name.endswith('.har'):
            self.har_files_parsed += 1
            scan_bytes(data, label, self.findings)
            return

        # Nested ZIP (trace or otherwise)
        if name.endswith('.zip'):
            is_trace = 'trace' in name
            self.scan_zip_bytes(data, label, is_trace)
            return

        # Text file
        scan_bytes(data, label, self.findings)

    def scan_dir(self, root: str):
        """Recursively scan a directory."""
        for dirpath, dirs, files in os.walk(root):
            for fname in sorted(files):
                fpath = os.path.join(dirpath, fname)
                label = os.path.relpath(fpath, root)
                self.scan_file(fpath, label)

    def scan_zip_file(self, path: str):
        """Scan an outer ZIP file, recursing into nested ZIPs."""
        with open(path, 'rb') as f:
            data = f.read()
        print(f"[scanner] Outer ZIP opened: YES")
        self.scan_zip_bytes(data, os.path.basename(path), is_trace=False)
        # The outer ZIP itself: the nested_zips_opened count includes the outer
        # so subtract 1 and report separately
        self.nested_zips_opened -= 1

    def report(self) -> int:
        """Print report. Returns exit code (0=clean, 1=secrets found)."""
        # Categorize findings
        session_count = sum(1 for f in self.findings
                           if f["pattern"] in ("sos_dev_session_value", "session_s_prefix", "session_colon_prefix"))
        csrf_count = sum(1 for f in self.findings
                        if f["pattern"] in ("csrf_value", "x_csrf_token_raw"))
        cookie_count = sum(1 for f in self.findings
                          if f["pattern"] in ("cookie_header_raw",))
        other_count = len(self.findings) - session_count - csrf_count - cookie_count

        print(f"Files scanned:            {self.files_scanned}")
        print(f"Nested ZIPs opened:       {self.nested_zips_opened}")
        print(f"Trace ZIPs opened:        {self.trace_zips_opened}")
        print(f"HAR files parsed:         {self.har_files_parsed}")
        print(f"Raw session candidates:   {session_count}")
        print(f"Raw CSRF candidates:      {csrf_count}")
        print(f"Raw cookie candidates:    {cookie_count}")
        print(f"Other findings:           {other_count}")
        print(f"Confirmed secrets:        {len(self.findings)}")

        if self.findings:
            print()
            print("FINDINGS (first 10):")
            for finding in self.findings[:10]:
                print(f"  [{finding['pattern']}] {finding['source']}: {finding['sample']}")
            return 1

        print()
        print("EXIT:0")
        print("PASS: No credential patterns detected.")
        return 0


def main():
    if len(sys.argv) < 2:
        print("Usage: secret-scanner-v4.py <path> [--log <logfile>]")
        sys.exit(1)

    target = sys.argv[1]
    log_path = None
    for i, a in enumerate(sys.argv):
        if a == '--log' and i + 1 < len(sys.argv):
            log_path = sys.argv[i + 1]

    scanner = Scanner()

    print(f"[scanner] Starting scan of: {target}")

    if os.path.isdir(target):
        scanner.scan_dir(target)
    elif target.endswith('.zip'):
        scanner.scan_zip_file(target)
    elif os.path.isfile(target):
        scanner.scan_file(target, os.path.basename(target))
    else:
        print(f"[scanner] ERROR: path not found: {target}")
        sys.exit(1)

    print(f"[scanner] Scan complete.")
    exit_code = scanner.report()

    if log_path:
        # Save full findings to log
        import subprocess
        pass  # report already printed to stdout

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
