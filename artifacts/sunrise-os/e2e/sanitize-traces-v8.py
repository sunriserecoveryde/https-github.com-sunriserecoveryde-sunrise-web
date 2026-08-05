#!/usr/bin/env python3
"""
sanitize-traces-v8.py — Phase 3 v8 trace sanitization with required ASCII naming.

Generates 19 sanitized trace ZIPs with canonical ASCII names mapped from
Playwright's auto-generated directory names.

Required output names:
  trace-A-1-production-login.zip
  trace-A-2-clinician-authenticated.zip
  trace-A-3-empty-note-state.zip
  trace-A-4-compose-panel-open.zip
  trace-A-5-draft-saved.zip
  trace-A-6-draft-signed.zip
  trace-B-1-nurse-logged-in.zip
  trace-B-2-nursing-note-signed.zip
  trace-C-1-supervisor-void-button.zip
  trace-C-2-void-reason-validation.zip
  trace-C-3-note-voided.zip
  trace-D-1-other-facility-denial.zip
  trace-D-2-security-admin-denial.zip
  trace-D-3-hr-denial.zip
  trace-D-4-billing-denial.zip
  trace-D-5-another-author-edit-denial.zip
  trace-D-6-another-author-sign-denial.zip
  trace-D-7-original-author-void-denial.zip
  trace-E-1-concurrency-conflict.zip

Usage:
    python3 e2e/sanitize-traces-v8.py \\
        --input  playwright-results/ \\
        --output /tmp/sunrise-phase3-v8/evidence/traces/
"""

import argparse
import json
import os
import re
import sys
import zipfile
from pathlib import Path
from typing import Optional

# ── Redaction token ────────────────────────────────────────────────────────────
REDACTED = "[REDACTED]"

# ── Header names that must be fully redacted (case-insensitive) ───────────────
SENSITIVE_HEADERS = {
    "cookie", "set-cookie", "authorization", "x-csrf-token", "proxy-authorization",
}

# ── JSON field names that trigger full value redaction ────────────────────────
SENSITIVE_FIELDS = {
    "password", "passwd", "secret", "token", "csrftoken", "csrf_token",
    "_csrf", "session", "sessionid", "sid", "connect.sid", "sos_dev_session",
    "authorization",
}

# ── Cookie names that must be redacted ────────────────────────────────────────
SENSITIVE_COOKIE_NAMES = {
    "_csrf", "sos_dev_session", "connect.sid", "session",
}

# ── Name mapping: substring patterns in dir name → canonical trace name ────────
# Each entry: (pattern_substrings, canonical_name)
# The first matching entry wins.  Substrings are checked in order (all must match).
NAME_MAP = [
    # Flow A
    (["Flow-A", "Production", "login-page-renders"],          "trace-A-1-production-login"),
    (["Flow-A", "Production", "logs-in-and-reaches"],         "trace-A-2-clinician-authenticated"),
    (["Flow-A", "Production", "authenticated"],               "trace-A-2-clinician-authenticated"),
    (["Flow-A", "Clinician", "empty-state"],                  "trace-A-3-empty-note-state"),
    (["Flow-A", "Clinician", "tab-shows-empty"],              "trace-A-3-empty-note-state"),
    (["Flow-A", "Clinician", "compose-panel"],                "trace-A-4-compose-panel-open"),
    (["Flow-A", "Clinician", "New-Note"],                     "trace-A-4-compose-panel-open"),
    (["Flow-A", "Clinician", "saves-as-draft"],               "trace-A-5-draft-saved"),
    (["Flow-A", "Clinician", "A-5"],                          "trace-A-5-draft-saved"),
    (["Flow-A", "Clinician", "draft-persists"],               "trace-A-6-draft-signed"),
    (["Flow-A", "Clinician", "can-edit-and-sign"],            "trace-A-6-draft-signed"),
    # Flow B
    (["Flow-B", "Nurse-login", "nurse-logs-in"],              "trace-B-1-nurse-logged-in"),
    (["Flow-B", "Nurse-login", "B-1"],                        "trace-B-1-nurse-logged-in"),
    (["Flow-B", "Nurse-creat", "nursing-note-and-signs"],     "trace-B-2-nursing-note-signed"),
    (["Flow-B", "Nurse-creat", "B-2"],                        "trace-B-2-nursing-note-signed"),
    # Flow C
    (["Flow-C", "Supervisor", "Void-button"],                 "trace-C-1-supervisor-void-button"),
    (["Flow-C", "Supervisor", "sees-Void"],                   "trace-C-1-supervisor-void-button"),
    (["Flow-C", "Supervisor", "C-2"],                         "trace-C-2-void-reason-validation"),
    (["Flow-C", "Supervisor", "short-reason"],                "trace-C-2-void-reason-validation"),
    (["Flow-C", "Supervisor", "void-modal-opens"],            "trace-C-2-void-reason-validation"),
    (["Flow-C", "Supervisor", "submitting-voids"],            "trace-C-3-note-voided"),
    (["Flow-C", "Supervisor", "C-3"],                         "trace-C-3-note-voided"),
    # Flow D
    (["Flow-D", "Authorizati", "Facility-1-patient-chart"],   "trace-D-1-other-facility-denial"),
    (["Flow-D", "Authorizati", "4238c"],                       "trace-D-1-other-facility-denial"),
    # D-2 and D-3 both show "PatientDetail-shows-AccessDenied" — distinguish by hash
    (["Flow-D", "Authorizati", "1607e"],                       "trace-D-2-security-admin-denial"),
    (["Flow-D", "Authorizati", "15271"],                       "trace-D-3-hr-denial"),
    # Fallback for D-2/D-3: first AccessDenied becomes D-2, second D-3
    (["Flow-D", "Authorizati", "Progress-Notes-compose"],      "trace-D-4-billing-denial"),
    (["Flow-D", "Authorizati", "ling-staff"],                  "trace-D-4-billing-denial"),
    (["Flow-D", "Authorizati", "edit-another-author"],         "trace-D-5-another-author-edit-denial"),
    (["Flow-D", "Authorizati", "26c11"],                       "trace-D-5-another-author-edit-denial"),
    (["Flow-D", "Authorizati", "sign-another-author"],         "trace-D-6-another-author-sign-denial"),
    (["Flow-D", "Authorizati", "ab07b"],                       "trace-D-6-another-author-sign-denial"),
    (["Flow-D", "Authorizati", "void-cannot-void"],            "trace-D-7-original-author-void-denial"),
    (["Flow-D", "Authorizati", "fcc8c"],                       "trace-D-7-original-author-void-denial"),
    # Flow E
    (["Flow-E", "Concurrency", "stale-version"],               "trace-E-1-concurrency-conflict"),
    (["Flow-E", "Concurrency"],                                "trace-E-1-concurrency-conflict"),
]

REQUIRED_NAMES = [
    "trace-A-1-production-login",
    "trace-A-2-clinician-authenticated",
    "trace-A-3-empty-note-state",
    "trace-A-4-compose-panel-open",
    "trace-A-5-draft-saved",
    "trace-A-6-draft-signed",
    "trace-B-1-nurse-logged-in",
    "trace-B-2-nursing-note-signed",
    "trace-C-1-supervisor-void-button",
    "trace-C-2-void-reason-validation",
    "trace-C-3-note-voided",
    "trace-D-1-other-facility-denial",
    "trace-D-2-security-admin-denial",
    "trace-D-3-hr-denial",
    "trace-D-4-billing-denial",
    "trace-D-5-another-author-edit-denial",
    "trace-D-6-another-author-sign-denial",
    "trace-D-7-original-author-void-denial",
    "trace-E-1-concurrency-conflict",
]


def map_dir_to_name(dir_name: str, used_names: set) -> Optional[str]:
    """Map a playwright-results directory name to a canonical trace name."""
    for patterns, name in NAME_MAP:
        if all(p in dir_name for p in patterns):
            if name not in used_names:
                return name
    # Fallback: if we still have AccessDenied dirs unmatched, assign D-2/D-3 in order
    if "AccessDenied" in dir_name or "PatientDetail-shows-AccessDenied" in dir_name:
        for candidate in ["trace-D-2-security-admin-denial", "trace-D-3-hr-denial"]:
            if candidate not in used_names:
                return candidate
    return None


# ── Sanitization helpers ──────────────────────────────────────────────────────

def sanitize_header_value(name: str, value) -> str:
    if isinstance(name, str) and name.lower() in SENSITIVE_HEADERS:
        return REDACTED
    return value


def sanitize_headers_list(headers) -> list:
    if not isinstance(headers, list):
        return headers
    return [
        {**h, "value": sanitize_header_value(h.get("name", ""), h.get("value", ""))}
        if isinstance(h, dict) else h
        for h in headers
    ]


def sanitize_cookie_object(c):
    if not isinstance(c, dict):
        return c
    name = c.get("name", "")
    if isinstance(name, str) and name.lower() in SENSITIVE_COOKIE_NAMES:
        return {**c, "value": REDACTED}
    return c


def sanitize_post_data(pd: dict) -> dict:
    """Redact sensitive fields in a postData object."""
    text = pd.get("text", "")
    if isinstance(text, str):
        try:
            obj = json.loads(text)
            if isinstance(obj, dict):
                obj = {
                    k: (REDACTED if k.lower() in SENSITIVE_FIELDS else v)
                    for k, v in obj.items()
                }
                pd = {**pd, "text": json.dumps(obj)}
        except (json.JSONDecodeError, ValueError):
            # URL-encoded form body — redact password= fields
            text = re.sub(
                r"(password|passwd|secret|token|_csrf|session)=[^&\s\"']+",
                r"\1=" + REDACTED,
                text,
                flags=re.IGNORECASE,
            )
            pd = {**pd, "text": text}
    return pd


def sanitize_json_value(obj):
    """Recursively sanitize a JSON value."""
    if isinstance(obj, dict):
        result = {}
        for k, v in obj.items():
            if isinstance(k, str) and k.lower() in SENSITIVE_FIELDS:
                result[k] = REDACTED
            elif isinstance(k, str) and k.lower() in SENSITIVE_HEADERS:
                result[k] = REDACTED
            elif k == "headers" and isinstance(v, list):
                result[k] = sanitize_headers_list(v)
            elif k == "cookies" and isinstance(v, list):
                result[k] = [sanitize_cookie_object(c) for c in v]
            elif k == "postData" and isinstance(v, dict):
                result[k] = sanitize_post_data(v)
            else:
                result[k] = sanitize_json_value(v)
        return result
    elif isinstance(obj, list):
        return [sanitize_json_value(item) for item in obj]
    return obj


def sanitize_ndjson_line(line: str) -> str:
    line = line.strip()
    if not line:
        return line
    try:
        obj = json.loads(line)
        typ = obj.get("type", "") if isinstance(obj, dict) else ""
        if typ == "network" and isinstance(obj.get("body"), dict):
            req = obj["body"].get("request", {})
            if isinstance(req, dict):
                req["headers"] = sanitize_headers_list(req.get("headers", []))
                req["cookies"] = [sanitize_cookie_object(c) for c in req.get("cookies", [])]
                if "postData" in req and isinstance(req["postData"], dict):
                    req["postData"] = sanitize_post_data(req["postData"])
            resp = obj["body"].get("response", {})
            if isinstance(resp, dict):
                resp["headers"] = sanitize_headers_list(resp.get("headers", []))
                resp["cookies"] = [sanitize_cookie_object(c) for c in resp.get("cookies", [])]
        elif isinstance(obj, dict):
            obj = sanitize_json_value(obj)
        return json.dumps(obj)
    except (json.JSONDecodeError, ValueError):
        return line


def sanitize_url_encoded_sessions(text: str) -> str:
    """Replace URL-encoded express-session values anywhere they appear."""
    for cname in ("sos_dev_session", "connect\\.sid", "_csrf"):
        text = re.sub(
            rf"({cname})=(?!\[REDACTED\])[A-Za-z0-9%_\-\.+/=]{{6,}}",
            r"\1=[REDACTED]", text, flags=re.IGNORECASE,
        )
    text = re.sub(
        r"s%3A(?!\[REDACTED\])[A-Za-z0-9_\-]{8,}(?:(?:\.|\%2E|%2e)(?:[A-Za-z0-9_\-]|%[A-F0-9]{2}){8,})?",
        "s%3A[REDACTED]", text, flags=re.IGNORECASE,
    )
    return text


def sanitize_file_content(name: str, content: bytes) -> bytes:
    try:
        text = content.decode("utf-8", errors="replace")
    except Exception:
        return content
    name_lower = name.lower()
    if name_lower.endswith((".trace", ".ndjson", ".jsonl", ".network")):
        lines = text.split("\n")
        text = "\n".join(sanitize_ndjson_line(line) for line in lines)
        text = sanitize_url_encoded_sessions(text)
        return text.encode("utf-8")
    if name_lower.endswith(".json"):
        try:
            obj = json.loads(text)
            return json.dumps(sanitize_json_value(obj), indent=2).encode("utf-8")
        except (json.JSONDecodeError, ValueError):
            return content
    if name_lower.endswith((".txt", ".html", ".htm", ".log")):
        text = re.sub(
            r"(cookie|set-cookie|authorization|x-csrf-token):\s*\S+",
            r"\1: [REDACTED]", text, flags=re.IGNORECASE,
        )
        text = re.sub(
            r"(sos_dev_session|connect\.sid|_csrf)\s*[=:]\s*[^\s;,\"']+",
            r"\1=[REDACTED]", text, flags=re.IGNORECASE,
        )
        return text.encode("utf-8")
    return content


RESIDUAL_PATTERNS = [
    re.compile(r"s%3A(?!\[REDACTED\])[A-Za-z0-9_\-]{10,}", re.IGNORECASE),
    re.compile(r"(sos_dev_session|connect\.sid)\s*[=:]\s*(?!\[REDACTED\])(?!s%3A\[REDACTED\])[A-Za-z0-9%_\-\.+/=s]{15,}", re.IGNORECASE),
    re.compile(r"\"cookie\"\s*:\s*\"(?!\[REDACTED\])[^\"]{20,}\"", re.IGNORECASE),
    re.compile(r"\"set-cookie\"\s*:\s*\"(?!\[REDACTED\])[^\"]{20,}\"", re.IGNORECASE),
    re.compile(r"\"authorization\"\s*:\s*\"(?!\[REDACTED\])[^\"]{10,}\"", re.IGNORECASE),
    re.compile(r"\"password\"\s*:\s*\"(?!\[REDACTED\])[^\"]{4,}\"", re.IGNORECASE),
]


def scan_zip_for_residuals(path: Path) -> list:
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
                    findings.append(f"  {path.name}/{name}: {m.group()[:80]!r}")
    return findings


def sanitize_zip(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(src, "r") as zin, \
         zipfile.ZipFile(dst, "w", compression=zipfile.ZIP_DEFLATED) as zout:
        for info in zin.infolist():
            raw = zin.read(info.filename)
            sanitized = sanitize_file_content(info.filename, raw)
            # Keep internal paths as-is (they're already ASCII in Playwright traces)
            ascii_path = re.sub(r"[^\x00-\x7F]", "-", info.filename)
            ascii_path = re.sub(r"-{2,}", "-", ascii_path)
            zout.writestr(ascii_path, sanitized)
    print(f"  sanitized: {src.parent.name} → {dst.name}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Sanitize Playwright trace ZIPs for v8")
    parser.add_argument("--input",  required=True, help="playwright-results/ directory")
    parser.add_argument("--output", required=True, help="Directory for sanitized traces")
    parser.add_argument("--verify", action="store_true", help="Scan for residual secrets")
    args = parser.parse_args()

    inp = Path(args.input)
    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)

    # Find all trace.zip files under subdirectories
    raw_zips = sorted(inp.rglob("trace.zip"))
    if not raw_zips:
        print(f"No trace.zip files found under {inp}", file=sys.stderr)
        sys.exit(1)

    print(f"Found {len(raw_zips)} raw trace ZIP(s).")

    used_names: set = set()
    unmatched = []
    sanitized_count = 0
    total_findings: list = []

    for src_zip in raw_zips:
        dir_name = src_zip.parent.name
        canonical = map_dir_to_name(dir_name, used_names)
        if canonical is None:
            print(f"  [WARN] No mapping for: {dir_name[:80]}", file=sys.stderr)
            unmatched.append(dir_name)
            continue
        used_names.add(canonical)
        dst_zip = out / f"{canonical}.zip"
        sanitize_zip(src_zip, dst_zip)
        sanitized_count += 1
        if args.verify:
            findings = scan_zip_for_residuals(dst_zip)
            if findings:
                print(f"  [WARN] Residuals in {dst_zip.name}:")
                for f in findings:
                    print(f)
            total_findings.extend(findings)

    print(f"\nSanitized {sanitized_count}/{len(raw_zips)} trace ZIP(s) → {out}")

    # Verify all required names were produced
    missing = [n for n in REQUIRED_NAMES if n not in used_names]
    if missing:
        print(f"\n[FAIL] Missing required trace names ({len(missing)}):", file=sys.stderr)
        for m in missing:
            print(f"  {m}", file=sys.stderr)
        sys.exit(1)
    else:
        print(f"[PASS] All {len(REQUIRED_NAMES)} required trace names produced.")

    if unmatched:
        print(f"\n[WARN] {len(unmatched)} unmatched source ZIP(s) (not included in output).")

    if args.verify:
        if total_findings:
            print(f"\n[FAIL] {len(total_findings)} residual secret finding(s):")
            for f in total_findings:
                print(f)
            sys.exit(1)
        else:
            print("[PASS] 0 residual secrets in sanitized traces.")


if __name__ == "__main__":
    main()
