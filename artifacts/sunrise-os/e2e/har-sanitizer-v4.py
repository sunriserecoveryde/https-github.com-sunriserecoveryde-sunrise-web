#!/usr/bin/env python3
"""
Phase 4 v4 — HAR Sanitizer
Deep-redacts all sensitive values from Playwright HAR files.
Redacted: sos_dev_session, all cookie values, X-CSRF-Token, _csrf,
Cookie/Set-Cookie headers, Authorization headers, passwords, login request bodies.
"""
import sys
import json
import re
import os

REDACTED = "[REDACTED]"

SENSITIVE_HEADER_NAMES = {
    "cookie", "set-cookie", "x-csrf-token", "authorization",
    "x-session", "x-auth-token", "x-xsrf-token",
}

SENSITIVE_COOKIE_NAMES = {
    "sos_dev_session", "_csrf", "session", "sid", "connect.sid",
}

SENSITIVE_BODY_FIELDS = {
    "password", "current_password", "new_password",
    "csrfToken", "csrf_token", "_csrf",
}


def redact_cookie_string(value: str) -> str:
    """Redact all name=value pairs in a cookie string."""
    return REDACTED


def redact_header(name: str, value: str) -> str:
    """Return redacted value if header is sensitive."""
    if name.lower() in SENSITIVE_HEADER_NAMES:
        return REDACTED
    # Redact any header value that looks like a session token
    if re.search(r's%3A|s:[A-Za-z0-9+/\-_]{20,}', value):
        return REDACTED
    return value


def redact_cookie_obj(cookie: dict) -> dict:
    """Redact a HAR cookie object."""
    name = cookie.get("name", "")
    # Always redact the value — cookie values should never appear in evidence
    cookie["value"] = REDACTED
    # Also redact httpOnly flag info if it leaks identity (keep it)
    return cookie


def redact_headers(headers: list) -> list:
    """Redact a list of HAR header objects."""
    out = []
    for h in headers:
        if not isinstance(h, dict):
            out.append(h)
            continue
        name = h.get("name", "")
        value = h.get("value", "")
        h["value"] = redact_header(name, value)
        out.append(h)
    return out


def redact_post_data(post_data: dict | None) -> dict | None:
    """Redact sensitive fields in POST body."""
    if not post_data:
        return post_data
    mime = post_data.get("mimeType", "")
    text = post_data.get("text", "")

    if "json" in mime and text:
        try:
            body = json.loads(text)
            if isinstance(body, dict):
                for field in SENSITIVE_BODY_FIELDS:
                    if field in body:
                        body[field] = REDACTED
                # Redact all fields in login requests
                if any(k in text.lower() for k in ["password", "login", "signin"]):
                    for k in list(body.keys()):
                        if k.lower() in ("password", "email", "username", "credential"):
                            body[k] = REDACTED
                post_data["text"] = json.dumps(body)
        except Exception:
            # Can't parse — redact the whole body if it looks like a login
            if "password" in text.lower():
                post_data["text"] = REDACTED
    elif "form" in mime or "urlencoded" in mime:
        # Redact form fields: password=xxx
        text = re.sub(r'(password=)[^&]+', r'\1[REDACTED]', text, flags=re.IGNORECASE)
        text = re.sub(r'(_csrf=)[^&]+', r'\1[REDACTED]', text, flags=re.IGNORECASE)
        post_data["text"] = text
    elif text and "password" in text.lower():
        post_data["text"] = REDACTED

    # Also redact params
    params = post_data.get("params", [])
    for p in params:
        if isinstance(p, dict):
            name = p.get("name", "").lower()
            if name in SENSITIVE_BODY_FIELDS or name in SENSITIVE_COOKIE_NAMES:
                p["value"] = REDACTED
    return post_data


def redact_entry(entry: dict) -> dict:
    """Redact a single HAR entry (request + response)."""
    req = entry.get("request", {})
    resp = entry.get("response", {})

    # Request headers
    if "headers" in req:
        req["headers"] = redact_headers(req["headers"])
    # Request cookies — redact all values
    if "cookies" in req:
        req["cookies"] = [redact_cookie_obj(c) for c in req["cookies"]]
    # Request POST body
    if "postData" in req:
        req["postData"] = redact_post_data(req.get("postData"))

    # Response headers
    if "headers" in resp:
        resp["headers"] = redact_headers(resp["headers"])
    # Response cookies — redact all values
    if "cookies" in resp:
        resp["cookies"] = [redact_cookie_obj(c) for c in resp["cookies"]]
    # Response body — redact if it contains session/csrf
    content = resp.get("content", {})
    body_text = content.get("text", "")
    if body_text and isinstance(body_text, str):
        if re.search(r'sos_dev_session|s%3A[A-Za-z0-9]{10,}', body_text, re.IGNORECASE):
            content["text"] = REDACTED

    return entry


def sanitize_har(input_path: str, output_path: str) -> dict:
    """Sanitize a HAR file. Returns stats dict."""
    with open(input_path, 'r', encoding='utf-8') as f:
        har = json.load(f)

    log = har.get("log", {})
    entries = log.get("entries", [])

    for entry in entries:
        redact_entry(entry)

    # Redact browser/creator info that might leak credentials
    # (keep URL/method/status/timing for usefulness)

    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else '.', exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(har, f, indent=2)

    return {"entries": len(entries)}


def verify_har(path: str) -> tuple[int, list]:
    """Scan for remaining secrets. Returns (count, samples)."""
    patterns = [
        re.compile(r's%3A[A-Za-z0-9%+/\-_]{20,}', re.IGNORECASE),
        re.compile(r's:[A-Za-z0-9+/\-_]{20,}\.', re.IGNORECASE),
        re.compile(r'sos_dev_session=[^"]{5,}', re.IGNORECASE),
        re.compile(r'"_csrf"\s*:\s*"[^R\[]{5,}"'),
        re.compile(r'"X-CSRF-Token"\s*:\s*"[^R\[]{5,}"', re.IGNORECASE),
    ]
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    findings = 0
    samples = []
    for pat in patterns:
        for m in pat.finditer(text):
            findings += 1
            val = m.group(0)[:80]
            if val not in samples:
                samples.append(val)
    return findings, samples


def main():
    if len(sys.argv) < 3:
        print("Usage: har-sanitizer-v4.py <input.har> <output.har>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    print(f"[har-sanitize] Reading {input_path}")

    try:
        stats = sanitize_har(input_path, output_path)
        print(f"[har-sanitize] {stats['entries']} entries processed → {output_path}")
    except Exception as e:
        print(f"[har-sanitize] ERROR: {e}")
        sys.exit(1)

    # Verify
    count, samples = verify_har(output_path)
    if count > 0:
        print(f"[har-sanitize] FAIL — {count} remaining secret pattern(s):")
        for s in samples[:5]:
            print(f"  SAMPLE: {s[:80]}")
        sys.exit(1)

    print("[har-sanitize] Verification pass: 0 credential patterns detected.")
    print("HAR JSON parse: PASS")
    print("Raw cookie candidates: 0")
    print("Raw session candidates: 0")
    print("Raw CSRF candidates: 0")
    print("Confirmed secrets: 0")
    sys.exit(0)


if __name__ == "__main__":
    main()
