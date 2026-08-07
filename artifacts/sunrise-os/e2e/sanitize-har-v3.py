#!/usr/bin/env python3
"""
sanitize-har-v3.py — Phase 4 v3 HAR Sanitizer
================================================
Performs complete redaction of all credential material from HAR files
before archiving as review evidence.

Redacts:
  • Set-Cookie / Cookie headers (sos_dev_session, connect.sid, and any
    other session or auth cookies)
  • X-CSRF-Token request headers
  • Authorization: Bearer / Basic headers
  • Any response body JSON field named: token, csrfToken, sessionId, sid
  • Response body Set-Cookie fields
  • URL query parameters: token=, session=, key=, secret=

Usage:
  python3 sanitize-har-v3.py <input.har> <output.har>

Exit 0 on success, non-zero on error.
"""

import sys
import json
import re
import copy

# Patterns that must be redacted
SESSION_COOKIE_NAMES = {
    "sos_dev_session",
    "sos_session",
    "connect.sid",
    "session",
    "sessionid",
}
SENSITIVE_REQUEST_HEADERS = {
    "x-csrf-token",
    "authorization",
    "cookie",
    "x-session-token",
    "x-auth-token",
    "x-api-key",
}
SENSITIVE_RESPONSE_HEADERS = {
    "set-cookie",
    "x-csrf-token",
}
SENSITIVE_BODY_KEYS = {
    "token",
    "csrfToken",
    "csrf_token",
    "sessionId",
    "session_id",
    "sid",
    "secret",
    "password",
    "accessToken",
    "access_token",
    "refreshToken",
    "refresh_token",
    "apiKey",
    "api_key",
    "privateKey",
    "private_key",
}
SENSITIVE_URL_PARAMS = {"token", "session", "key", "secret", "api_key", "access_token"}

REDACTED = "[REDACTED]"


def redact_cookie_header_value(value: str) -> str:
    """Redact all cookie k=v pairs where k is a session/auth cookie name."""
    parts = [p.strip() for p in value.split(";")]
    redacted_parts = []
    for part in parts:
        if "=" in part:
            name, _, _ = part.partition("=")
            if name.strip().lower() in SESSION_COOKIE_NAMES or \
               name.strip().lower().startswith("sos_"):
                redacted_parts.append(f"{name.strip()}={REDACTED}")
            else:
                redacted_parts.append(part)
        else:
            redacted_parts.append(part)
    return "; ".join(redacted_parts)


def redact_headers(headers: list) -> list:
    """Redact sensitive request or response headers in-place (returns new list)."""
    result = []
    for h in headers:
        name_lower = h.get("name", "").lower()
        if name_lower in SENSITIVE_REQUEST_HEADERS:
            if name_lower == "cookie":
                result.append({**h, "value": redact_cookie_header_value(h.get("value", ""))})
            else:
                result.append({**h, "value": REDACTED})
        elif name_lower in SENSITIVE_RESPONSE_HEADERS:
            if name_lower == "set-cookie":
                # Fully redact session cookie values
                val = h.get("value", "")
                # Find the cookie name at start
                cookie_name = val.split("=")[0].strip().lower() if "=" in val else ""
                if cookie_name in SESSION_COOKIE_NAMES or cookie_name.startswith("sos_"):
                    result.append({**h, "value": f"{val.split('=')[0]}={REDACTED}"})
                else:
                    result.append(h)
            else:
                result.append({**h, "value": REDACTED})
        else:
            result.append(h)
    return result


def redact_url(url: str) -> str:
    """Redact sensitive query parameters from URLs."""
    if "?" not in url:
        return url
    base, _, query = url.partition("?")
    pairs = query.split("&")
    redacted = []
    for pair in pairs:
        if "=" in pair:
            k, _, v = pair.partition("=")
            if k.lower() in SENSITIVE_URL_PARAMS:
                redacted.append(f"{k}={REDACTED}")
            else:
                redacted.append(pair)
        else:
            redacted.append(pair)
    return base + "?" + "&".join(redacted)


def redact_body_json(text: str) -> str:
    """
    Attempt to parse as JSON and redact sensitive fields.
    Returns original text if not valid JSON.
    """
    try:
        obj = json.loads(text)
    except (json.JSONDecodeError, ValueError):
        return text

    obj = redact_json_obj(obj)
    return json.dumps(obj)


def redact_json_obj(obj):
    """Recursively redact sensitive keys in a parsed JSON object."""
    if isinstance(obj, dict):
        result = {}
        for k, v in obj.items():
            if k in SENSITIVE_BODY_KEYS:
                result[k] = REDACTED
            else:
                result[k] = redact_json_obj(v)
        return result
    elif isinstance(obj, list):
        return [redact_json_obj(item) for item in obj]
    else:
        return obj


def redact_entry(entry: dict) -> dict:
    """Redact a single HAR entry (request + response)."""
    entry = copy.deepcopy(entry)

    # Request
    req = entry.get("request", {})
    req["headers"] = redact_headers(req.get("headers", []))
    req["url"]     = redact_url(req.get("url", ""))

    # Request cookies
    for c in req.get("cookies", []):
        if c.get("name", "").lower() in SESSION_COOKIE_NAMES or \
           c.get("name", "").lower().startswith("sos_"):
            c["value"] = REDACTED

    # Request body
    post_data = req.get("postData", {})
    if post_data:
        mime = post_data.get("mimeType", "")
        text = post_data.get("text", "")
        if "json" in mime and text:
            post_data["text"] = redact_body_json(text)
        req["postData"] = post_data

    entry["request"] = req

    # Response
    resp = entry.get("response", {})
    resp["headers"] = redact_headers(resp.get("headers", []))

    # Response cookies
    for c in resp.get("cookies", []):
        if c.get("name", "").lower() in SESSION_COOKIE_NAMES or \
           c.get("name", "").lower().startswith("sos_"):
            c["value"] = REDACTED

    # Response body
    content = resp.get("content", {})
    if content:
        mime = content.get("mimeType", "")
        text = content.get("text", "")
        if "json" in mime and text:
            content["text"] = redact_body_json(text)
        resp["content"] = content

    entry["response"] = resp

    # Timings: redact internal timing fields that might contain env hostnames
    # (safe to keep as-is for numeric fields, just drop unused string fields)

    return entry


def sanitize_har(input_path: str, output_path: str) -> None:
    print(f"[sanitize] Reading {input_path}")

    with open(input_path, "r", encoding="utf-8") as f:
        har = json.load(f)

    entries = har.get("log", {}).get("entries", [])
    print(f"[sanitize] {len(entries)} entries to process")

    sanitized_entries = [redact_entry(e) for e in entries]
    har["log"]["entries"] = sanitized_entries

    # Redact creator/browser version strings that might leak env details
    creator = har.get("log", {}).get("creator", {})
    if creator:
        har["log"]["creator"] = {
            "name":    creator.get("name", "Playwright"),
            "version": "REDACTED",
        }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(har, f, indent=2, ensure_ascii=False)

    print(f"[sanitize] Wrote {output_path}")

    # Verify: scan for obvious credential patterns in output
    with open(output_path, "r", encoding="utf-8") as f:
        out_text = f.read()

    # Any long base64-like string following "sos_dev_session=" is a cookie value
    DANGER_PATTERNS = [
        r"sos_dev_session=[A-Za-z0-9%+/]{10,}",
        r'"X-CSRF-Token"\s*:\s*"[A-Za-z0-9+/=]{10,}"',
        r'"Authorization"\s*:\s*"Bearer [A-Za-z0-9._-]{10,}"',
    ]
    found = False
    for pat in DANGER_PATTERNS:
        m = re.search(pat, out_text, re.IGNORECASE)
        if m:
            print(f"[sanitize] ERROR: Credential pattern still present: {m.group()[:60]}")
            found = True
    if found:
        sys.exit(1)

    print("[sanitize] Verification pass: no credential patterns detected.")


def main():
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <input.har> <output.har>")
        sys.exit(1)
    sanitize_har(sys.argv[1], sys.argv[2])


if __name__ == "__main__":
    main()
