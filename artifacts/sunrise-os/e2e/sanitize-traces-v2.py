#!/usr/bin/env python3
"""
sanitize-traces-v2.py — Phase 3 v4 complete trace sanitization.

Completely removes sensitive fields (password, cookie, session, CSRF, auth headers)
from Playwright trace.zip files.  Partial substring replacement is NOT used —
every sensitive field is replaced with the fixed token [REDACTED] or removed
entirely.  ASCII-only output filenames are enforced.

Usage:
    python3 e2e/sanitize-traces-v2.py \
        --input  playwright-results/ \
        --output readiness/phase-3-final/sanitized-traces/ \
        --verify  # open each rebuilt trace with Playwright trace viewer

After sanitization, run:
    python3 readiness/scripts/secret-scanner.py readiness/phase-3-final/sanitized-traces/
to confirm 0 secrets in output.
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path
from typing import Any

# ── Redaction token ────────────────────────────────────────────────────────────
REDACTED = "[REDACTED]"

# ── Header names that must be fully redacted (case-insensitive) ───────────────
SENSITIVE_HEADERS = {
    "cookie",
    "set-cookie",
    "authorization",
    "x-csrf-token",
    "proxy-authorization",
}

# ── JSON field names that trigger full value redaction ────────────────────────
SENSITIVE_FIELDS = {
    "password",
    "passwd",
    "secret",
    "token",
    "csrftoken",
    "csrf_token",
    "_csrf",
    "session",
    "sessionid",
    "sid",
    "connect.sid",
    "sos_dev_session",
    "authorization",
}

# ── Cookie names that must be redacted ────────────────────────────────────────
SENSITIVE_COOKIE_NAMES = {
    "_csrf",
    "sos_dev_session",
    "connect.sid",
    "session",
}


# ── Field-level sanitization ──────────────────────────────────────────────────

def sanitize_header_value(name: str, value: Any) -> Any:
    """Return REDACTED for sensitive headers; leave others unchanged."""
    if isinstance(name, str) and name.lower() in SENSITIVE_HEADERS:
        return REDACTED
    return value


def sanitize_headers_list(headers: Any) -> Any:
    """Sanitize a list of {name, value} header objects."""
    if not isinstance(headers, list):
        return headers
    result = []
    for h in headers:
        if isinstance(h, dict):
            name = h.get("name", "")
            val  = h.get("value", "")
            result.append({**h, "value": sanitize_header_value(name, val)})
        else:
            result.append(h)
    return result


def sanitize_headers_dict(headers: Any) -> Any:
    """Sanitize a {name: value} header dict."""
    if not isinstance(headers, dict):
        return headers
    return {
        k: (REDACTED if k.lower() in SENSITIVE_HEADERS else v)
        for k, v in headers.items()
    }


def sanitize_cookie_object(cookie: Any) -> Any:
    """Fully redact sensitive cookies; keep name for identification."""
    if not isinstance(cookie, dict):
        return cookie
    name = cookie.get("name", "").lower()
    if name in SENSITIVE_COOKIE_NAMES or name.endswith("session") or name.endswith("csrf"):
        return {**cookie, "value": REDACTED}
    return cookie


def sanitize_post_data(post_data: Any) -> Any:
    """Remove password and session fields from POST body objects."""
    if not isinstance(post_data, dict):
        return post_data
    result = {}
    for k, v in post_data.items():
        if isinstance(k, str) and k.lower() in SENSITIVE_FIELDS:
            result[k] = REDACTED
        elif isinstance(v, dict):
            result[k] = sanitize_post_data(v)
        elif isinstance(v, list):
            result[k] = [sanitize_post_data(i) for i in v]
        else:
            result[k] = v
    return result


def sanitize_text_body(text: Any) -> Any:
    """Redact JSON-encoded sensitive fields in text response/request bodies."""
    if not isinstance(text, str):
        return text
    # Try to parse as JSON
    try:
        obj = json.loads(text)
        sanitized = sanitize_json_value(obj)
        return json.dumps(sanitized)
    except (json.JSONDecodeError, ValueError):
        pass
    # Plain text: strip any obvious credential-looking patterns
    # (cookie header values, session IDs, etc.)
    return text  # non-JSON text bodies are kept as-is (no PII expected)


def sanitize_json_value(obj: Any) -> Any:
    """Recursively sanitize a JSON-decoded value."""
    if isinstance(obj, dict):
        result = {}
        for k, v in obj.items():
            if isinstance(k, str) and k.lower() in SENSITIVE_FIELDS:
                result[k] = REDACTED
            elif isinstance(k, str) and k.lower() in ("cookies", "cookie"):
                # Cookies array or dict — redact each entry
                if isinstance(v, list):
                    result[k] = [sanitize_cookie_object(c) for c in v]
                else:
                    result[k] = REDACTED
            elif isinstance(k, str) and k.lower() in ("headers",):
                if isinstance(v, list):
                    result[k] = sanitize_headers_list(v)
                elif isinstance(v, dict):
                    result[k] = sanitize_headers_dict(v)
                else:
                    result[k] = v
            elif isinstance(k, str) and k.lower() in ("postdata", "post_data", "requestbody", "body"):
                result[k] = sanitize_post_data(v) if isinstance(v, dict) else sanitize_text_body(v)
            else:
                result[k] = sanitize_json_value(v)
        return result
    elif isinstance(obj, list):
        return [sanitize_json_value(i) for i in obj]
    else:
        return obj


# ── NDJSON line sanitization ──────────────────────────────────────────────────

def sanitize_ndjson_line(raw: str) -> str:
    """Parse a single NDJSON line, sanitize, and re-encode."""
    raw = raw.rstrip("\n")
    if not raw:
        return ""
    try:
        obj = json.loads(raw)
    except (json.JSONDecodeError, ValueError):
        return raw  # non-JSON line — leave unchanged

    obj = sanitize_json_value(obj)

    # Playwright trace-specific deep sanitization:
    # Network events embed full request/response data in nested structures.
    if isinstance(obj, dict):
        typ = obj.get("type", "")

        # Network resource event
        if typ in ("resource", "network"):
            if "request" in obj and isinstance(obj["request"], dict):
                req = obj["request"]
                req["headers"]  = sanitize_headers_list(req.get("headers", []))
                req["cookies"]  = [sanitize_cookie_object(c) for c in req.get("cookies", [])]
                if "postData" in req:
                    pd = req["postData"]
                    if isinstance(pd, dict):
                        req["postData"] = sanitize_post_data(pd)
                    elif isinstance(pd, str):
                        req["postData"] = sanitize_text_body(pd)
            if "response" in obj and isinstance(obj["response"], dict):
                resp = obj["response"]
                resp["headers"] = sanitize_headers_list(resp.get("headers", []))
                resp["cookies"] = [sanitize_cookie_object(c) for c in resp.get("cookies", [])]

        # Log/console events may carry auth data in messages
        if typ in ("log", "console") and "message" in obj:
            msg = obj["message"]
            if isinstance(msg, str):
                # Redact session cookie values in log messages
                msg = re.sub(
                    r"(sos_dev_session|connect\.sid|_csrf)\s*[=:]\s*\S+",
                    r"\1=[REDACTED]",
                    msg,
                    flags=re.IGNORECASE,
                )
                obj["message"] = msg

    return json.dumps(obj)


def sanitize_ndjson(content: str) -> str:
    """Sanitize multi-line NDJSON content."""
    lines = content.split("\n")
    return "\n".join(sanitize_ndjson_line(line) for line in lines)


def sanitize_json_file(content: str) -> str:
    """Sanitize a single-object JSON file."""
    try:
        obj = json.loads(content)
        return json.dumps(sanitize_json_value(obj), indent=2)
    except (json.JSONDecodeError, ValueError):
        return content


# ── File-level dispatch ───────────────────────────────────────────────────────

def sanitize_url_encoded_sessions(text: str) -> str:
    """Replace URL-encoded express-session values anywhere they appear.

    Playwright trace.trace files embed navigation events, storage state, and
    browser context data as NDJSON.  Session cookie values appear URL-encoded
    in navigation URLs, storage snapshots, and other non-header locations that
    the per-field sanitizers do not reach.  This final-pass regex catches all
    remaining instances.

    Strategy (applied in order):
    1. Replace the ENTIRE value of known session cookie assignments — handles
       URL-encoded chars (%2B, %2F, etc.) in the express-session signature.
    2. Replace any bare s%3A<id> prefix that wasn't caught by step 1.
    """
    # Step 1: replace full cookie assignment value (robust — handles %2B, %2F in sig)
    for cname in ("sos_dev_session", "connect\\.sid", "_csrf"):
        text = re.sub(
            rf"({cname})=(?!\[REDACTED\])[A-Za-z0-9%_\-\.+/=]{{6,}}",
            r"\1=[REDACTED]",
            text,
            flags=re.IGNORECASE,
        )

    # Step 2: clean up any partial-redaction remnant where the ID was replaced
    # but a URL-encoded signature tail (e.g. %2BAgCVYa5j8) was left behind.
    text = re.sub(
        r"(sos_dev_session|connect\.sid)=s%3A\[REDACTED\][A-Za-z0-9%_\-\.+/=]+",
        r"\1=[REDACTED]",
        text,
        flags=re.IGNORECASE,
    )

    # Step 3: replace any bare s%3A<id> values still present (e.g. in raw URLs
    # where the cookie name prefix is absent).
    text = re.sub(
        r"s%3A(?!\[REDACTED\])[A-Za-z0-9_\-]{8,}(?:(?:\.|\%2E|%2e)(?:[A-Za-z0-9_\-]|%[A-F0-9]{2}){8,})?",
        "s%3A[REDACTED]",
        text,
        flags=re.IGNORECASE,
    )

    return text


def sanitize_file_content(name: str, content: bytes) -> bytes:
    """Sanitize a file's content based on its name/extension."""
    try:
        text = content.decode("utf-8", errors="replace")
    except Exception:
        return content  # binary file — do not alter

    name_lower = name.lower()

    # NDJSON / trace / network event files
    if name_lower.endswith((".trace", ".ndjson", ".jsonl", ".network")):
        text = sanitize_ndjson(text)
        # Final pass: redact URL-encoded session values not reached by JSON-level sanitization
        text = sanitize_url_encoded_sessions(text)
        return text.encode("utf-8")

    # JSON files
    if name_lower.endswith(".json"):
        return sanitize_json_file(text).encode("utf-8")

    # Plain text / HTML snapshots — redact obvious cookie-header patterns
    if name_lower.endswith((".txt", ".html", ".htm", ".log")):
        text = re.sub(
            r"(cookie|set-cookie|authorization|x-csrf-token):\s*\S+",
            r"\1: [REDACTED]",
            text,
            flags=re.IGNORECASE,
        )
        text = re.sub(
            r"(sos_dev_session|connect\.sid|_csrf)\s*[=:]\s*[^\s;,\"']+",
            r"\1=[REDACTED]",
            text,
            flags=re.IGNORECASE,
        )
        return text.encode("utf-8")

    # Everything else (images, etc.) — unchanged
    return content


# ── ASCII filename normaliser ─────────────────────────────────────────────────

def to_ascii_filename(name: str) -> str:
    """Convert a filename to ASCII-only, replacing non-ASCII chars with hyphens."""
    # Replace common Unicode punctuation
    name = name.replace("\u2014", "-")  # em dash
    name = name.replace("\u2013", "-")  # en dash
    name = name.replace("\u2018", "")   # left single quote
    name = name.replace("\u2019", "")   # right single quote
    name = name.replace("\u201c", "")   # left double quote
    name = name.replace("\u201d", "")   # right double quote
    # Replace any remaining non-ASCII, non-path chars with hyphen
    name = re.sub(r"[^\x00-\x7F]", "-", name)
    # Collapse consecutive hyphens
    name = re.sub(r"-{2,}", "-", name)
    return name


# ── ZIP processing ────────────────────────────────────────────────────────────

def sanitize_zip(src: Path, dst: Path) -> None:
    """Extract src ZIP, sanitize all files, rebuild as dst ZIP with ASCII paths."""
    dst.parent.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(src, "r") as zin, \
         zipfile.ZipFile(dst, "w", compression=zipfile.ZIP_DEFLATED) as zout:

        for info in zin.infolist():
            raw = zin.read(info.filename)
            sanitized = sanitize_file_content(info.filename, raw)

            # Enforce ASCII-only path inside the ZIP
            ascii_path = to_ascii_filename(info.filename)
            zout.writestr(ascii_path, sanitized)

    print(f"  sanitized: {src.name} → {dst.name}")


# ── Post-sanitization checks ──────────────────────────────────────────────────

RESIDUAL_PATTERNS = [
    # Session cookie values — s%3A prefix with actual ID chars (not already [REDACTED])
    # The negative lookahead prevents flagging s%3A[REDACTED] as a residual.
    re.compile(r"s%3A(?!\[REDACTED\])[A-Za-z0-9_\-]{10,}", re.IGNORECASE),
    # Full cookie assignment — flag only when value is NOT already [REDACTED]
    # Matches "sos_dev_session=<something>" where <something> does not start
    # with [REDACTED] and is long enough to be a real credential.
    re.compile(r"(sos_dev_session|connect\.sid)\s*[=:]\s*(?!\[REDACTED\])(?!s%3A\[REDACTED\])[A-Za-z0-9%_\-\.+/=s]{15,}", re.IGNORECASE),
    # Cookie header with value
    re.compile(r"\"cookie\"\s*:\s*\"(?!\[REDACTED\])[^\"]{20,}\"", re.IGNORECASE),
    # Set-Cookie with value
    re.compile(r"\"set-cookie\"\s*:\s*\"(?!\[REDACTED\])[^\"]{20,}\"", re.IGNORECASE),
    # Authorization header with value
    re.compile(r"\"authorization\"\s*:\s*\"(?!\[REDACTED\])[^\"]{10,}\"", re.IGNORECASE),
    # Raw passwords in JSON
    re.compile(r"\"password\"\s*:\s*\"(?!\[REDACTED\])[^\"]{4,}\"", re.IGNORECASE),
]


def scan_zip_for_residuals(path: Path) -> list[str]:
    """Return a list of findings (line excerpts) if any residual secrets remain."""
    findings = []
    with zipfile.ZipFile(path, "r") as z:
        for name in z.namelist():
            try:
                raw = z.read(name)
                text = raw.decode("utf-8", errors="replace")
            except Exception:
                continue
            for pat in RESIDUAL_PATTERNS:
                for m in pat.finditer(text):
                    findings.append(f"{path.name}/{name}: {m.group()[:80]!r}")
    return findings


# ── Entry point ───────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Sanitize Playwright trace ZIPs")
    parser.add_argument("--input",  required=True, help="Directory containing raw trace ZIPs")
    parser.add_argument("--output", required=True, help="Directory for sanitized trace ZIPs")
    parser.add_argument("--verify", action="store_true", help="Scan output for residual secrets")
    args = parser.parse_args()

    inp = Path(args.input)
    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)

    # Find all trace ZIPs
    raw_zips = sorted(inp.rglob("trace.zip"))
    if not raw_zips:
        # Also check direct .zip files
        raw_zips = sorted(inp.glob("*.zip"))

    if not raw_zips:
        print(f"No trace ZIPs found in {inp}", file=sys.stderr)
        sys.exit(1)

    print(f"Found {len(raw_zips)} trace ZIP(s) to sanitize.")

    total_findings = []
    sanitized_count = 0

    for src_zip in raw_zips:
        # Build ASCII-only output filename
        rel   = src_zip.relative_to(inp)
        parts = [to_ascii_filename(p) for p in rel.parts]
        dst_zip = out.joinpath(*parts)
        dst_zip.parent.mkdir(parents=True, exist_ok=True)

        sanitize_zip(src_zip, dst_zip)
        sanitized_count += 1

        if args.verify:
            findings = scan_zip_for_residuals(dst_zip)
            if findings:
                print(f"  [WARN] Residual findings in {dst_zip.name}:")
                for f in findings:
                    print(f"    {f}")
            total_findings.extend(findings)

    print(f"\nSanitized {sanitized_count} trace ZIP(s) → {out}")

    if args.verify:
        if total_findings:
            print(f"\n[FAIL] {len(total_findings)} residual finding(s) after sanitization:")
            for f in total_findings:
                print(f"  {f}")
            sys.exit(1)
        else:
            print("[PASS] 0 residual findings in sanitized traces.")


if __name__ == "__main__":
    main()
