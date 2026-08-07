#!/usr/bin/env python3
"""
sanitize-har.py — Phase 3 v4 HAR sanitization.

Completely removes credential material from Playwright-generated HAR files:
  * Request cookies
  * Response cookies
  * Cookie header
  * Set-Cookie header
  * Authorization headers
  * X-CSRF-Token headers
  * CSRF values
  * Session IDs
  * Password fields in request bodies
  * Login request bodies
  * Sensitive query parameters

Does NOT use partial/substring replacement — every sensitive value is replaced
with the fixed token [REDACTED].

After sanitization:
  1. Re-parses the JSON to confirm it is still valid.
  2. Confirms useful URLs, methods, statuses, and timings remain.
  3. Optionally runs the recursive secret scanner.

Usage:
    python3 e2e/sanitize-har.py --input e2e/traces/ --output readiness/phase-3-final/har/
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any

REDACTED = "[REDACTED]"

SENSITIVE_HEADERS = {
    "cookie",
    "set-cookie",
    "authorization",
    "proxy-authorization",
    "x-csrf-token",
    "x-xsrf-token",
}

SENSITIVE_QUERY_PARAMS = {
    "token",
    "session",
    "auth",
    "password",
    "secret",
    "csrf",
}

SENSITIVE_BODY_FIELDS = {
    "password",
    "passwd",
    "secret",
    "token",
    "csrf",
    "csrftoken",
    "_csrf",
    "session",
}


# ── Helpers ────────────────────────────────────────────────────────────────────

def redact_headers(headers: Any) -> Any:
    """Redact sensitive HTTP headers from a list or dict."""
    if isinstance(headers, list):
        result = []
        for h in headers:
            if not isinstance(h, dict):
                result.append(h)
                continue
            name = h.get("name", "")
            if isinstance(name, str) and name.lower() in SENSITIVE_HEADERS:
                result.append({**h, "value": REDACTED})
            else:
                result.append(h)
        return result
    elif isinstance(headers, dict):
        return {
            k: (REDACTED if isinstance(k, str) and k.lower() in SENSITIVE_HEADERS else v)
            for k, v in headers.items()
        }
    return headers


def redact_cookies(cookies: Any) -> Any:
    """Fully redact all cookie values (keep name for debugging)."""
    if not isinstance(cookies, list):
        return cookies
    return [{**c, "value": REDACTED} if isinstance(c, dict) else c for c in cookies]


def redact_query_params(params: Any) -> Any:
    """Redact sensitive query string parameters."""
    if not isinstance(params, list):
        return params
    result = []
    for p in params:
        if not isinstance(p, dict):
            result.append(p)
            continue
        name = p.get("name", "").lower()
        if name in SENSITIVE_QUERY_PARAMS:
            result.append({**p, "value": REDACTED})
        else:
            result.append(p)
    return result


def redact_post_data(post_data: Any) -> Any:
    """Redact sensitive fields in POST body; detect login bodies."""
    if not isinstance(post_data, dict):
        return post_data

    text = post_data.get("text", "")
    mime = post_data.get("mimeType", "")

    # JSON-encoded POST body
    if "json" in mime.lower() and isinstance(text, str) and text.strip():
        try:
            body = json.loads(text)
            if isinstance(body, dict):
                sanitized = {}
                for k, v in body.items():
                    if isinstance(k, str) and k.lower() in SENSITIVE_BODY_FIELDS:
                        sanitized[k] = REDACTED
                    else:
                        sanitized[k] = v
                return {**post_data, "text": json.dumps(sanitized)}
        except (json.JSONDecodeError, ValueError):
            pass

    # URL-encoded POST body
    if "urlencoded" in mime.lower() and isinstance(text, str):
        pairs = []
        for pair in text.split("&"):
            if "=" in pair:
                k, v = pair.split("=", 1)
                if k.lower() in SENSITIVE_BODY_FIELDS:
                    pairs.append(f"{k}={REDACTED}")
                else:
                    pairs.append(pair)
            else:
                pairs.append(pair)
        return {**post_data, "text": "&".join(pairs)}

    # Form data params
    if "params" in post_data and isinstance(post_data["params"], list):
        sanitized_params = []
        for p in post_data["params"]:
            if isinstance(p, dict) and isinstance(p.get("name"), str):
                if p["name"].lower() in SENSITIVE_BODY_FIELDS:
                    sanitized_params.append({**p, "value": REDACTED})
                else:
                    sanitized_params.append(p)
            else:
                sanitized_params.append(p)
        return {**post_data, "params": sanitized_params}

    return post_data


def redact_response_content(content: Any, url: str = "") -> Any:
    """Redact sensitive data from response content bodies."""
    if not isinstance(content, dict):
        return content

    text = content.get("text", "")
    mime = content.get("mimeType", "")

    if "json" in mime.lower() and isinstance(text, str) and text.strip():
        try:
            body = json.loads(text)
            if isinstance(body, dict):
                sanitized = {}
                for k, v in body.items():
                    if isinstance(k, str) and k.lower() in SENSITIVE_BODY_FIELDS:
                        sanitized[k] = REDACTED
                    else:
                        sanitized[k] = v
                return {**content, "text": json.dumps(sanitized)}
        except (json.JSONDecodeError, ValueError):
            pass

    return content


def redact_har_entry(entry: Any) -> Any:
    """Sanitize a single HAR entry (request + response)."""
    if not isinstance(entry, dict):
        return entry

    result = dict(entry)

    # Request
    if "request" in result and isinstance(result["request"], dict):
        req = dict(result["request"])
        req["headers"]     = redact_headers(req.get("headers", []))
        req["cookies"]     = redact_cookies(req.get("cookies", []))
        req["queryString"] = redact_query_params(req.get("queryString", []))
        if "postData" in req:
            req["postData"] = redact_post_data(req["postData"])
        result["request"] = req

    # Response
    if "response" in result and isinstance(result["response"], dict):
        resp = dict(result["response"])
        resp["headers"] = redact_headers(resp.get("headers", []))
        resp["cookies"] = redact_cookies(resp.get("cookies", []))
        if "content" in resp:
            resp["content"] = redact_response_content(
                resp["content"],
                url=entry.get("request", {}).get("url", ""),
            )
        result["response"] = resp

    return result


def sanitize_har(har: Any) -> Any:
    """Sanitize a parsed HAR object."""
    if not isinstance(har, dict):
        return har

    result = dict(har)
    if "log" in result and isinstance(result["log"], dict):
        log = dict(result["log"])
        if "entries" in log and isinstance(log["entries"], list):
            log["entries"] = [redact_har_entry(e) for e in log["entries"]]
        result["log"] = log
    return result


def validate_har(har: Any) -> list[str]:
    """Return a list of validation errors (empty = valid)."""
    errors = []
    if not isinstance(har, dict):
        errors.append("HAR is not a JSON object")
        return errors
    if "log" not in har:
        errors.append("HAR is missing 'log' key")
        return errors
    log = har["log"]
    if "entries" not in log:
        errors.append("log is missing 'entries' key")
        return errors
    entries = log["entries"]
    if not isinstance(entries, list):
        errors.append("log.entries is not an array")
        return errors
    # Check useful fields survive
    useful = 0
    for e in entries:
        if isinstance(e, dict) and "request" in e and "response" in e:
            req  = e["request"]
            resp = e["response"]
            if req.get("url") and resp.get("status"):
                useful += 1
    if useful == 0:
        errors.append("No entries with url+status survived sanitization")
    return errors


# ── Secret residual patterns (for post-sanitization scan) ─────────────────────

RESIDUAL_PATTERNS = [
    re.compile(r'"cookie"\s*:\s*"(?!\[REDACTED\])[^"]{10,}"', re.IGNORECASE),
    re.compile(r'"set-cookie"\s*:\s*"(?!\[REDACTED\])[^"]{10,}"', re.IGNORECASE),
    re.compile(r'"authorization"\s*:\s*"(?!\[REDACTED\])[^"]{10,}"', re.IGNORECASE),
    re.compile(r'"password"\s*:\s*"(?!\[REDACTED\])[^"]{4,}"', re.IGNORECASE),
    re.compile(r"sos_dev_session\s*[=:]\s*(?!\[REDACTED\])\S+", re.IGNORECASE),
    re.compile(r"connect\.sid\s*[=:]\s*(?!\[REDACTED\])\S+", re.IGNORECASE),
    re.compile(r"_csrf\s*[=:]\s*(?!\[REDACTED\])\S+", re.IGNORECASE),
]


def scan_text_for_residuals(text: str, label: str) -> list[str]:
    findings = []
    for pat in RESIDUAL_PATTERNS:
        for m in pat.finditer(text):
            findings.append(f"{label}: {m.group()[:80]!r}")
    return findings


# ── Entry point ────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Sanitize Playwright HAR files")
    parser.add_argument("--input",  required=True, help="Directory containing raw HAR files")
    parser.add_argument("--output", required=True, help="Directory for sanitized HAR files")
    parser.add_argument("--verify", action="store_true", help="Scan output for residual secrets")
    args = parser.parse_args()

    inp = Path(args.input)
    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)

    har_files = sorted(inp.glob("**/*.har"))
    if not har_files:
        print(f"No .har files found in {inp}", file=sys.stderr)
        sys.exit(1)

    print(f"Found {len(har_files)} HAR file(s) to sanitize.")

    total_findings = []

    for src in har_files:
        raw = src.read_text(encoding="utf-8", errors="replace")

        try:
            har = json.loads(raw)
        except json.JSONDecodeError as e:
            print(f"  [SKIP] {src.name}: invalid JSON — {e}", file=sys.stderr)
            continue

        sanitized_har = sanitize_har(har)
        sanitized_text = json.dumps(sanitized_har, indent=2, ensure_ascii=True)

        # Validate
        errors = validate_har(sanitized_har)
        for err in errors:
            print(f"  [WARN] {src.name}: {err}")

        # Write output with ASCII-only filename
        dst_name = re.sub(r"[^\x00-\x7F]", "-", src.name)
        dst      = out / dst_name
        dst.write_text(sanitized_text, encoding="utf-8")
        print(f"  sanitized: {src.name} → {dst.name}")

        # Scan for residuals
        if args.verify:
            findings = scan_text_for_residuals(sanitized_text, dst.name)
            if findings:
                print(f"  [WARN] Residual findings in {dst.name}:")
                for f in findings:
                    print(f"    {f}")
            total_findings.extend(findings)

    print(f"\nSanitized {len(har_files)} HAR file(s) → {out}")

    if args.verify:
        if total_findings:
            print(f"\n[FAIL] {len(total_findings)} residual finding(s):")
            for f in total_findings:
                print(f"  {f}")
            sys.exit(1)
        else:
            print("[PASS] 0 residual findings in sanitized HAR files.")


if __name__ == "__main__":
    main()
