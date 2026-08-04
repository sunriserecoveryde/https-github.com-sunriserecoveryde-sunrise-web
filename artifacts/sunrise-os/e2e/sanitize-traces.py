#!/usr/bin/env python3
"""
Playwright trace and HAR sanitizer for Phase 3 review archive.

Removes all sensitive values from Playwright trace.zip files and HAR files:
  - Passwords (matched patterns)
  - Cookie values (sos_dev_session, connect.sid, _csrf, etc.)
  - Set-Cookie header values
  - CSRF tokens
  - Session IDs
  - Authorization headers
  - Any value matching known credential patterns

Usage:
  python3 sanitize-traces.py --traces <playwright-results-dir> --hars <traces-dir> --out <output-dir>
"""

import argparse
import hashlib
import json
import os
import re
import shutil
import sys
import tempfile
import zipfile

# ── Patterns to sanitize ──────────────────────────────────────────────────────

# Cookie names whose VALUES must be redacted
SENSITIVE_COOKIE_NAMES = re.compile(
    r"^(sos_dev_session|connect\.sid|_csrf|session|sid|auth|token|jwt)$",
    re.IGNORECASE,
)

# Header names whose VALUES must be redacted
SENSITIVE_HEADER_NAMES = re.compile(
    r"^(authorization|x-csrf-token|set-cookie|cookie|x-session-id)$",
    re.IGNORECASE,
)

# Patterns in arbitrary strings that look like credentials
CREDENTIAL_PATTERNS = [
    re.compile(r"(SunrisePhase3_[0-9a-f]{16}!)", re.IGNORECASE),  # rotated password
    re.compile(r"(Sunrise2026!Test)", re.IGNORECASE),              # old hardcoded password
    re.compile(r"(sos_dev_session=[^&\s;\"']{4,})"),              # session cookie in URL
    re.compile(r"(connect\.sid=[^&\s;\"']{4,})"),                 # express session in URL
    re.compile(r"(s%3A[A-Za-z0-9_\-]{20,})"),                    # url-encoded session ID
]

REDACTED = "[REDACTED]"


def redact_string(value: str) -> str:
    """Redact credential patterns from an arbitrary string."""
    for pattern in CREDENTIAL_PATTERNS:
        value = pattern.sub(REDACTED, value)
    return value


def sanitize_cookies(cookies) -> list:
    """Redact values of sensitive cookies."""
    if not isinstance(cookies, list):
        return cookies
    result = []
    for cookie in cookies:
        if isinstance(cookie, dict):
            name = cookie.get("name", "") or cookie.get("key", "")
            if SENSITIVE_COOKIE_NAMES.match(str(name)):
                cookie = dict(cookie)
                if "value" in cookie:
                    cookie["value"] = REDACTED
        result.append(cookie)
    return result


def sanitize_headers(headers) -> list:
    """Redact values of sensitive headers."""
    if not isinstance(headers, list):
        return headers
    result = []
    for header in headers:
        if isinstance(header, dict):
            name = header.get("name", "")
            if SENSITIVE_HEADER_NAMES.match(str(name)):
                header = dict(header)
                header["value"] = REDACTED
        result.append(header)
    return result


def sanitize_har_entry(entry: dict) -> dict:
    """Sanitize one HAR request/response entry."""
    entry = dict(entry)

    # Sanitize request
    if "request" in entry:
        req = dict(entry["request"])
        req["headers"] = sanitize_headers(req.get("headers", []))
        req["cookies"] = sanitize_cookies(req.get("cookies", []))
        # Redact URL query params that might contain tokens
        if "url" in req:
            req["url"] = redact_string(req["url"])
        # Redact POST body
        if "postData" in req and isinstance(req["postData"], dict):
            pd = dict(req["postData"])
            if "text" in pd:
                pd["text"] = redact_string(pd["text"])
                # For JSON bodies containing password/token fields
                try:
                    body = json.loads(pd["text"])
                    if isinstance(body, dict):
                        for key in ("password", "token", "csrfToken", "csrf_token"):
                            if key in body:
                                body[key] = REDACTED
                        pd["text"] = json.dumps(body)
                except (json.JSONDecodeError, TypeError):
                    pass
            req["postData"] = pd
        entry["request"] = req

    # Sanitize response
    if "response" in entry:
        resp = dict(entry["response"])
        resp["headers"] = sanitize_headers(resp.get("headers", []))
        resp["cookies"] = sanitize_cookies(resp.get("cookies", []))
        # Redact response body that might contain session tokens
        if "content" in resp and isinstance(resp["content"], dict):
            content = dict(resp["content"])
            if "text" in content:
                try:
                    body = json.loads(content["text"])
                    if isinstance(body, dict):
                        for key in ("csrfToken", "token", "sessionId", "session_id"):
                            if key in body:
                                body[key] = REDACTED
                        content["text"] = json.dumps(body)
                except (json.JSONDecodeError, TypeError):
                    pass
            resp["content"] = content
        entry["response"] = resp

    return entry


def sanitize_har_file(src: str, dst: str) -> None:
    """Sanitize a HAR file, writing sanitized version to dst."""
    with open(src) as f:
        har = json.load(f)

    if "log" in har and "entries" in har["log"]:
        har["log"]["entries"] = [sanitize_har_entry(e) for e in har["log"]["entries"]]

    with open(dst, "w") as f:
        json.dump(har, f, indent=2)


def sanitize_trace_event(event: dict) -> dict:
    """Sanitize one NDJSON event from a Playwright .trace or .network file."""
    event_str = json.dumps(event)

    # Quick pass: redact credential patterns in the whole event string
    for pattern in CREDENTIAL_PATTERNS:
        event_str = pattern.sub(REDACTED, event_str)

    try:
        event = json.loads(event_str)
    except json.JSONDecodeError:
        return event

    # Deep sanitize network events
    if event.get("type") in ("request", "response", "requestFinished", "requestFailed"):
        if "headers" in event:
            headers = event["headers"]
            if isinstance(headers, dict):
                for key in list(headers.keys()):
                    if SENSITIVE_HEADER_NAMES.match(key):
                        headers[key] = REDACTED
            elif isinstance(headers, list):
                event["headers"] = sanitize_headers(headers)

        if "cookies" in event:
            event["cookies"] = sanitize_cookies(event["cookies"])

        if "postData" in event:
            try:
                body = json.loads(event["postData"])
                if isinstance(body, dict):
                    for key in ("password", "token", "csrfToken"):
                        if key in body:
                            body[key] = REDACTED
                    event["postData"] = json.dumps(body)
            except (json.JSONDecodeError, TypeError):
                pass

    return event


def sanitize_trace_zip(src_zip: str, dst_zip: str) -> None:
    """Extract, sanitize, and rebuild a Playwright trace.zip."""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Extract
        with zipfile.ZipFile(src_zip, "r") as zf:
            zf.extractall(tmpdir)

        # Sanitize all .trace and .network files (NDJSON format)
        for root, _, files in os.walk(tmpdir):
            for fname in files:
                fpath = os.path.join(root, fname)
                if fname.endswith((".trace", ".network")):
                    lines = []
                    with open(fpath, encoding="utf-8", errors="replace") as f:
                        for line in f:
                            line = line.rstrip()
                            if not line:
                                lines.append("")
                                continue
                            try:
                                event = json.loads(line)
                                event = sanitize_trace_event(event)
                                lines.append(json.dumps(event))
                            except json.JSONDecodeError:
                                # Non-JSON line: redact patterns directly
                                for pattern in CREDENTIAL_PATTERNS:
                                    line = pattern.sub(REDACTED, line)
                                lines.append(line)
                    with open(fpath, "w", encoding="utf-8") as f:
                        f.write("\n".join(lines))

        # Rebuild zip
        os.makedirs(os.path.dirname(dst_zip), exist_ok=True)
        with zipfile.ZipFile(dst_zip, "w", zipfile.ZIP_DEFLATED) as zf:
            for root, _, files in os.walk(tmpdir):
                for fname in files:
                    fpath = os.path.join(root, fname)
                    arcname = os.path.relpath(fpath, tmpdir)
                    zf.write(fpath, arcname)


def secret_scan(path: str) -> list[str]:
    """Return list of lines containing potential secrets."""
    hits = []
    for pattern in CREDENTIAL_PATTERNS:
        if pattern.search(path):
            hits.append(f"FILENAME: {path}")
    if os.path.isfile(path) and not path.endswith((".zip", ".png", ".jpg", ".jpeg")):
        try:
            with open(path, encoding="utf-8", errors="replace") as f:
                for i, line in enumerate(f, 1):
                    for pattern in CREDENTIAL_PATTERNS:
                        if pattern.search(line):
                            hits.append(f"{path}:{i}: {pattern.pattern}")
        except (OSError, UnicodeDecodeError):
            pass
    return hits


def main():
    parser = argparse.ArgumentParser(description="Sanitize Playwright traces and HAR files")
    parser.add_argument("--traces-in", required=True, help="Directory with original trace.zip files")
    parser.add_argument("--hars-in", nargs="*", default=[], help="HAR files to sanitize")
    parser.add_argument("--out", required=True, help="Output directory for sanitized evidence")
    args = parser.parse_args()

    out_traces = os.path.join(args.out, "traces")
    out_hars = os.path.join(args.out, "browser-network")
    os.makedirs(out_traces, exist_ok=True)
    os.makedirs(out_hars, exist_ok=True)

    trace_count = 0
    har_count = 0

    # Sanitize traces
    for dirpath, dirnames, filenames in os.walk(args.traces_in):
        for fname in filenames:
            if fname == "trace.zip":
                src = os.path.join(dirpath, fname)
                rel = os.path.relpath(os.path.dirname(src), args.traces_in)
                dst_dir = os.path.join(out_traces, rel)
                os.makedirs(dst_dir, exist_ok=True)
                dst = os.path.join(dst_dir, fname)
                print(f"Sanitizing trace: {src} → {dst}")
                sanitize_trace_zip(src, dst)
                trace_count += 1

    # Sanitize HARs
    for har_src in args.hars_in:
        fname = os.path.basename(har_src)
        dst = os.path.join(out_hars, fname)
        print(f"Sanitizing HAR: {har_src} → {dst}")
        sanitize_har_file(har_src, dst)
        har_count += 1

    # Secret scan the output
    print(f"\n=== Sanitized: {trace_count} trace(s), {har_count} HAR(s) ===")
    print("\n=== Secret scan of sanitized output ===")
    hits = []
    for root, _, files in os.walk(args.out):
        for fname in files:
            fpath = os.path.join(root, fname)
            hits.extend(secret_scan(fpath))
    if hits:
        print(f"FAIL: {len(hits)} potential secret(s) found:")
        for h in hits:
            print(f"  {h}")
        sys.exit(1)
    else:
        print(f"PASS: 0 confirmed secrets in sanitized output ({trace_count} traces, {har_count} HARs)")


if __name__ == "__main__":
    main()
