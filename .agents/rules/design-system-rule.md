---
trigger: glob
---

# Design System Rules

Governs UI consistency. The design system is no longer a placeholder — it's a locked set of tokens exported from `design-tokens.tokens.json` as CSS custom properties. This file governs how those tokens are used. General aesthetic taste (which color, which typeface, "modern" look) was already decided when the tokens were authored; it is not up for relitigation per component. What's below are the rules that, if broken, break a real product guarantee or silently drift the UI away from the locked system even if a screen "looks fine" in isolation.

## The tokens are locked, not a starting point

- All color, spacing, and typography values used in the UI come from the CSS variables defined in the design tokens file (`--color-*`, `--spacing-*`, `--typography-*`, `--effect-*`). No component introduces a new hex color, a new pixel spacing value, a new font size, or a new shadow that isn't already one of these variables.
- If a component needs a value the token set doesn't have, that's a design-system gap to raise, not a reason to hardcode one value locally. Do not invent `#0741fe` next to `--color-primary: #0741ffff` because it's "close enough."
- This is enforced the same way as any other coding standard: a raw hex code, raw `px` value, or hardcoded `font-family` string in component styles is a review-blocking issue, not a style suggestion.

## Primitive colors are never used directly (hard rule)

- The token file explicitly states that primitive colors are resolved into color roles (`--color-primary`, `--color-surface`, etc.) and are **intentionally not exported** so they can't be applied directly to UI. Respect that boundary. No component, inline style, or one-off CSS file re-introduces a raw primitive hex value to bypass the semantic roles.
- Always style against the semantic role (`--color-primary`, `--color-error-container`) never against "the blue one" picked from a palette by eye.

## Color roles map to meaning, not to decoration

- `--color-primary` / `--color-on-primary` and their container pairs are for primary actions and emphasis (e.g. "Export," "Upgrade to PRO") — not used interchangeably with secondary/tertiary just because they're visually similar.
- `--color-error`, `--color-on-error`, `--color-error-container`, `--color-on-error-container` are the fixed, only acceptable color set for anything representing a `LOW` confidence span or `GAP` flag (R10, R11), in the editor, the original-image comparison view (R20), and the reader (R24). No component picks a different warning color, a custom orange, or a muted red "for this one view" — flags use the error role everywhere, consistently, because a flag that looks different in one place than another is how a student misses unread or fabricated-looking content. This is a functional guarantee, not a color preference.
- `--color-surface` / `--color-surface-variant` / `--color-surface-container*` steps are the only acceptable background layering system. Don't build custom elevation by picking arbitrary greys — use the provided container steps (`lowest` → `low` → base → `high` → `highest`) in order, matching depth to hierarchy.
- `--color-outline` is the only border/divider color. No component defines its own border color.

## Typography

- Every text style in the UI maps to one of the defined type roles (`display-large/medium/small`, `headline-large/medium/small`, `title-large/medium/small`, `body-large/medium/small`, `label-large/medium/small`) with its paired font size, weight, line height, and letter spacing pulled from the corresponding token group. No component sets `font-size` or `line-height` as a standalone override.
- Body text used for sustained reading — the finished-book reader view (R24) and the section editor — uses `body-large` or `body-medium`. This is a study product; reading legibility is a functional requirement, not a stylistic nicety, so this pairing is not swapped for a smaller label-sized style to "fit more on screen."
- `Roboto` (the Material Design 3 default typeface) is the only typeface used anywhere in the product. No fallback stack substitutions beyond standard system-font fallback for load failure.

## Spacing

- All padding, margin, and gap values use the spacing scale (`--spacing-collection-*`, 0/4/8/12/16/20/24/32) exclusively. No arbitrary spacing value (e.g. `13px`, `18px`) appears in any component style.
- Consistent spacing scale usage is what keeps density uniform between the upload flow, the editor, and the reader — three views built at different times by different tasks must still feel like one product.

## Effects

- Shadows use only `--effect-hard-shadow`, `--effect-medium-shadow`, or `--effect-soft-shadow`. No component defines a custom `box-shadow` value. Use `soft` for low-emphasis elevation (cards, containers), `medium` for interactive/hover states, `hard` for the highest-emphasis overlays (modals, the export/watermark preview).

## Diagrams stay where they're recorded

- Diagrams render at their recorded in-flow position (`Section.order`, `Diagram.order`/`sectionId`) in both the editor and the exported PDF (R12, R23). Never reflow, float, or reposition a diagram for layout convenience — its position is data, not a suggestion.

## Watermark visibility

- The free-plan watermark (R25) must be visible in the export preview shown to the student before they download, not only discoverable after opening the downloaded PDF. No surprise watermark.
- The PRO no-watermark state must reflect the live subscription status (see `money-and-billing.md`) — the UI must never show a "no watermark" preview for a plan state that isn't actually active.

## What's explicitly not a rule here

- Which token values were chosen (the specific blue, the specific type scale) is a decision already made upstream of this file. Debating whether `--color-primary` should be a different shade of blue is out of scope for a coding task — raise it as a design change to the token source file, not as an implementation detail to override locally.