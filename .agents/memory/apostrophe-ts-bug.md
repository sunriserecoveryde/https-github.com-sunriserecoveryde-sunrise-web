---
name: Apostrophe TS parse bug
description: ASCII apostrophe inside a single-quoted TS string literal terminates the string early, producing cryptic "','expected" errors at character offsets — not at the apostrophe itself.
---

## The rule
Any single-quoted TypeScript string field value that contains a plain ASCII apostrophe (`'`) will terminate early and produce a cascade of "','expected" parse errors pointing to downstream characters, not the actual apostrophe. This is indistinguishable from a curly-quote (U+2019) at a glance.

**Why:** JS/TS single-quoted strings have no auto-escaping. An unescaped `'` inside closes the string. The errors land on what the parser sees as "unexpected tokens" after the premature close.

**How to apply:** Whenever `npx tsc --noEmit` reports `error TS1005: ',' expected` at multiple character offsets on the same line, read that line and look for a `'s ` or other apostrophe-containing word inside a single-quoted string value. Fix by switching the outer delimiters to double quotes, or escape with `\'`. In `mockCompliance.ts`, use the `/tmp/fix_apostrophe.py` pattern (regex on description/relevance/notes/scope fields) to batch-fix across the whole file.
