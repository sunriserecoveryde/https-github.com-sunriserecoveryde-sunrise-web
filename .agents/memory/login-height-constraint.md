---
name: Login page height constraint
description: min-h-screen vs h-screen on the outer wrapper; why flex children silently grow to content height
---

## The Rule
The outermost wrapper of the login page (any full-viewport page using nested flex-1/flex-col chains) must use **h-screen overflow-hidden**, NOT **min-h-screen**.

## Why
`min-h-screen` = `min-height: 100vh`. This does NOT give flex children a *definite* height. Without a definite height, `flex: 1 1 0%` children resolve to their content size instead. The aside (flex-col) grew to match the full unscrolled content height of the right panel (~2,189px), pushing every text element far below the visible viewport. `overflow: hidden` on the aside then silently clipped all of them — no error, no warning.

## How to Apply
- Full-viewport pages: use `h-screen overflow-hidden flex flex-col` on the outermost div.
- Debug signal: `element.clientHeight` on the aside showing 2000+ instead of ~871px.
