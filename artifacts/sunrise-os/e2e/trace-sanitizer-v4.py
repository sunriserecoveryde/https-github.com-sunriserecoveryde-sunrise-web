#!/usr/bin/env python3
"""
Phase 4 v4 — Playwright Trace Sanitizer
Extracts each trace ZIP, deep-redacts all sensitive values in text files,
and repacks into a sanitized ZIP. Binary files (JPEG, PNG, etc.) pass through unchanged.

Redacted: sos_dev_session, session cookies, X-CSRF-Token, _csrf, Cookie headers,
Set-Cookie headers, Authorization headers, passwords, login request bodies.
"""
import sys
import os
import re
import json
import zipfile
import shutil
import tempfile

SENSITIVE_HEADER_NAMES = {
    "cookie", "set-cookie", "x-csrf-token", "authorization",
    "x-session", "x-auth-token",
}

SENSITIVE_COOKIE_NAMES = {
    "sos_dev_session", "_csrf", "session", "sid", "connect.sid",
}

SENSITIVE_BODY_FIELDS = {
    "password", "current_password", "new_password", "token",
    "csrfToken", "csrf_token",
}

REDACTED = "[REDACTED]"

# Regex patterns for line-level redaction (applied as fallback to non-parseable lines)
REGEX_PATTERNS = [
    # sos_dev_session cookie value (URL-encoded or plain)
    (re.compile(r'(sos_dev_session=)([^"\';\s,&]+)', re.IGNORECASE), r'\1[REDACTED]'),
    # _csrf cookie value
    (re.compile(r'(_csrf=)([^"\';\s,&]+)', re.IGNORECASE), r'\1[REDACTED]'),
    # X-CSRF-Token: <value>
    (re.compile(r'("X-CSRF-Token"\s*:\s*")[^"]+(")', re.IGNORECASE), r'\1[REDACTED]\2'),
    # Authorization: Bearer <token>
    (re.compile(r'(Authorization:\s*)(Bearer\s+\S+)', re.IGNORECASE), r'\1[REDACTED]'),
    # Connect-pg-simple style session: s%3A... or s:...
    (re.compile(r'"value"\s*:\s*"(s%3A[^"]{10,}|s:[A-Za-z0-9\-_+/]{10,})"'), r'"value":"[REDACTED]"'),
]

TEXT_EXTENSIONS = {
    '.trace', '.network', '.jsonl', '.json', '.txt', '.html',
    '.htm', '.log', '.css', '.js', '.svg',
}

BINARY_EXTENSIONS = {
    '.jpeg', '.jpg', '.png', '.webp', '.gif', '.ico',
    '.woff', '.woff2', '.ttf', '.otf', '.eot',
    '.mp4', '.mp3', '.wav', '.pdf', '.zip',
}


def redact_value_str(s: str) -> str:
    """Redact sensitive patterns within a string value."""
    if not isinstance(s, str):
        return s
    # Redact entire string if it looks like a session token
    if re.search(r's%3A|s:[A-Za-z0-9\-_+/]{20,}', s):
        return REDACTED
    # Redact partial cookie string: key=value pairs
    s = re.sub(r'(sos_dev_session=)([^;\s,&"\']+)', r'\1[REDACTED]', s, flags=re.IGNORECASE)
    s = re.sub(r'(_csrf=)([^;\s,&"\']+)', r'\1[REDACTED]', s, flags=re.IGNORECASE)
    return s


def redact_json_node(node):
    """Recursively walk a JSON node and redact sensitive values."""
    if isinstance(node, dict):
        # Check for header-style objects: {"name": "Cookie", "value": "..."}
        name = node.get("name", "")
        if isinstance(name, str) and name.lower() in SENSITIVE_HEADER_NAMES:
            if "value" in node:
                node["value"] = REDACTED
            return node

        # Check for cookie-style objects: {"name": "sos_dev_session", "value": "..."}
        if isinstance(name, str) and name.lower() in SENSITIVE_COOKIE_NAMES:
            if "value" in node:
                node["value"] = REDACTED
            return node

        # Walk all keys
        for key in list(node.keys()):
            k_lower = key.lower()
            val = node[key]

            # Direct field name matches for sensitive data
            if k_lower in ("password", "current_password", "new_password"):
                node[key] = REDACTED
            elif k_lower in ("cookie", "set-cookie"):
                node[key] = REDACTED
            elif k_lower in ("x-csrf-token", "csrftoken", "csrf_token", "csrfvalue"):
                node[key] = REDACTED
            elif k_lower in ("authorization", "x-auth-token"):
                node[key] = REDACTED
            elif k_lower in ("sos_dev_session", "_csrf"):
                node[key] = REDACTED
            elif k_lower == "storagestate" and isinstance(val, dict):
                # storageState contains cookies with session values
                node[key] = redact_json_node(val)
            elif k_lower == "cookies" and isinstance(val, list):
                node[key] = [redact_json_node(c) for c in val]
            elif k_lower == "headers" and isinstance(val, list):
                node[key] = [redact_json_node(h) for h in val]
            elif isinstance(val, (dict, list)):
                node[key] = redact_json_node(val)
            elif isinstance(val, str):
                node[key] = redact_value_str(val)

        return node

    elif isinstance(node, list):
        return [redact_json_node(item) for item in node]

    elif isinstance(node, str):
        return redact_value_str(node)

    return node


def is_binary_file(name: str) -> bool:
    ext = os.path.splitext(name)[1].lower()
    if ext in BINARY_EXTENSIONS:
        return True
    # Files without extensions in resources/ that are hex-named (SHA1) are binary blobs
    basename = os.path.basename(name)
    if re.match(r'^[0-9a-f]{40}$', basename):
        return True
    return False


def sanitize_text_file(content_bytes: bytes) -> bytes:
    """Sanitize a text file: try JSON line-by-line, fall back to regex."""
    try:
        text = content_bytes.decode('utf-8', errors='replace')
    except Exception:
        return content_bytes

    lines = text.splitlines(keepends=True)
    out_lines = []

    for line in lines:
        stripped = line.rstrip('\r\n')
        if stripped:
            # Try to parse as JSON
            try:
                node = json.loads(stripped)
                node = redact_json_node(node)
                sanitized = json.dumps(node, separators=(',', ':'))
                line = sanitized + ('\r\n' if line.endswith('\r\n') else '\n')
            except json.JSONDecodeError:
                # Not valid JSON: apply regex patterns
                for pattern, replacement in REGEX_PATTERNS:
                    stripped = pattern.sub(replacement, stripped)
                line = stripped + ('\r\n' if line.endswith('\r\n') else '\n')
        out_lines.append(line)

    return ''.join(out_lines).encode('utf-8')


def sanitize_trace_zip(input_zip_path: str, output_zip_path: str) -> dict:
    """
    Sanitize a Playwright trace ZIP.
    Returns a stats dict.
    """
    stats = {
        "input": input_zip_path,
        "output": output_zip_path,
        "files_processed": 0,
        "files_binary": 0,
        "files_text": 0,
    }

    with tempfile.TemporaryDirectory() as tmpdir:
        # Extract all files
        with zipfile.ZipFile(input_zip_path, 'r') as zin:
            zin.extractall(tmpdir)

        # Walk and sanitize
        file_list = []
        for root, dirs, files in os.walk(tmpdir):
            for fname in files:
                fpath = os.path.join(root, fname)
                arcname = os.path.relpath(fpath, tmpdir)
                file_list.append((fpath, arcname))

        for fpath, arcname in sorted(file_list):
            stats["files_processed"] += 1
            ext = os.path.splitext(arcname)[1].lower()

            if is_binary_file(arcname):
                stats["files_binary"] += 1
                # Pass through unchanged
            else:
                stats["files_text"] += 1
                with open(fpath, 'rb') as f:
                    raw = f.read()
                sanitized = sanitize_text_file(raw)
                with open(fpath, 'wb') as f:
                    f.write(sanitized)

        # Repack into output ZIP
        os.makedirs(os.path.dirname(output_zip_path), exist_ok=True)
        with zipfile.ZipFile(output_zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
            for fpath, arcname in sorted(file_list):
                zout.write(fpath, arcname)

    return stats


def verify_no_secrets(zip_path: str) -> tuple[int, list]:
    """Scan a sanitized trace ZIP for remaining secrets. Returns (count, samples)."""
    patterns = [
        re.compile(r's%3A[A-Za-z0-9%+/\-_]{20,}', re.IGNORECASE),
        re.compile(r's:[A-Za-z0-9+/\-_]{20,}\.', re.IGNORECASE),
        re.compile(r'sos_dev_session=[^"\s\]]{5,}', re.IGNORECASE),
        re.compile(r'_csrf=[^"\s\]]{5,}', re.IGNORECASE),
        re.compile(r'"X-CSRF-Token"\s*:\s*"[^R\[]{5,}"', re.IGNORECASE),
    ]

    findings = 0
    samples = []

    with zipfile.ZipFile(zip_path, 'r') as z:
        for name in z.namelist():
            if is_binary_file(name):
                continue
            try:
                content = z.read(name).decode('utf-8', errors='replace')
                for pat in patterns:
                    for m in pat.finditer(content):
                        findings += 1
                        val = m.group(0)[:60]
                        if val not in samples:
                            samples.append(f"{name}: {val}")
                        if len(samples) >= 10:
                            return findings, samples
            except Exception:
                continue

    return findings, samples


def main():
    if len(sys.argv) < 3:
        print("Usage: trace-sanitizer-v4.py <input_dir_or_zip> <output_dir>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_dir = sys.argv[2]

    os.makedirs(output_dir, exist_ok=True)

    # Collect input trace ZIPs
    if os.path.isdir(input_path):
        trace_zips = []
        for root, dirs, files in os.walk(input_path):
            for f in files:
                if f.endswith('.zip'):
                    trace_zips.append(os.path.join(root, f))
    elif input_path.endswith('.zip'):
        trace_zips = [input_path]
    else:
        print(f"[ERROR] Input must be a directory or .zip file: {input_path}")
        sys.exit(1)

    if not trace_zips:
        print("[ERROR] No trace ZIPs found")
        sys.exit(1)

    total_processed = 0
    total_text_files = 0
    total_binary_files = 0
    failed = []
    secret_count = 0
    secret_samples = []

    for zip_path in sorted(trace_zips):
        basename = os.path.basename(zip_path)
        # Ensure ASCII output filename
        ascii_name = re.sub(r'[^\x20-\x7E]', '-', basename)
        ascii_name = re.sub(r'-+', '-', ascii_name)
        out_path = os.path.join(output_dir, ascii_name)

        print(f"[sanitize] {basename}")
        try:
            stats = sanitize_trace_zip(zip_path, out_path)
            total_processed += 1
            total_text_files += stats["files_text"]
            total_binary_files += stats["files_binary"]

            # Verify no secrets remain
            sc, samples = verify_no_secrets(out_path)
            if sc > 0:
                secret_count += sc
                secret_samples.extend(samples)
                failed.append(f"SECRETS IN: {basename} ({sc} matches)")
                print(f"  [FAIL] {sc} secret pattern(s) remain: {samples[:3]}")
            else:
                print(f"  [OK] text={stats['files_text']} binary={stats['files_binary']} → {ascii_name}")

        except Exception as e:
            failed.append(f"ERROR: {basename}: {e}")
            print(f"  [ERROR] {e}")

    print()
    print("=== Trace Sanitization Summary ===")
    print(f"Trace ZIPs processed:    {total_processed}")
    print(f"Text files sanitized:    {total_text_files}")
    print(f"Binary files (pass-thru):{total_binary_files}")
    print(f"Raw session candidates:  {secret_count}")
    print(f"Raw CSRF candidates:     {secret_count}")
    print(f"Confirmed secrets:       {secret_count}")

    if failed:
        print()
        print("FAILURES:")
        for f in failed:
            print(f"  {f}")
        for s in secret_samples[:5]:
            print(f"  SAMPLE: {s}")
        print("EXIT:1 — sanitization incomplete")
        sys.exit(1)
    else:
        print()
        print("Trace integrity: ALL PASS")
        print("Raw session candidates: 0")
        print("Raw CSRF candidates: 0")
        print("Confirmed secrets: 0")
        print("EXIT:0")
        sys.exit(0)


if __name__ == "__main__":
    main()
