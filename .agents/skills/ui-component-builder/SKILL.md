---
name: ui-component-builder
description: Use when building or editing anything a user sees — components, screens, styling, or the design system. Triggers on component, screen, style, design system, token.
---

# UI Component Builder

Teaches semantic-token discipline, the gap-filling procedure for missing tokens, non-color-only flag rendering, and a responsive floor. Laws live in `design-system-rule.md`, R18 (visibly highlighted), R20/R24, and R25/R34 (watermark visibility).

## Procedure

1. Identify the semantic role needed (primary action, error/flag, surface layer, body text, spacing) and use its matching CSS variable. Never write a raw hex, px, or font-family value.
2. If the token set has no matching value, stop. This is a design-system gap, not a reason to hardcode. Flag it in your task output; only if truly blocking, use the nearest existing token as a temporary stand-in with a clear note.
3. If rendering a `LOW` or `GAP` span, use `--color-error`/`--color-on-error`/`--color-error-container`/`--color-on-error-container` exclusively, and pair the color with a non-color signal (icon, underline, or label). `[ASSUMED — extends R18's "visibly highlighted" to include a non-color-only signal, since color alone isn't perceivable by every reader]`. Use this treatment identically in the editor, the R20 comparison view, and the R24 reader.
4. If rendering diagrams, place them at their recorded `Section`/`order` position. Never reflow for layout convenience (R12, R23).
5. If the component is or precedes an export/download step, show the free-plan watermark in the preview before download, and never show a "no watermark" state unless the live `Subscription` is active (R25, R34).
6. Use only the defined typography roles for text. Body text (reader, R24; section editor) uses `body-large` or `body-medium` specifically — legibility is functional here, not decorative.
7. Use only the spacing scale (0/4/8/12/16/20/24/32) and the three defined shadow tokens.
8. `[ASSUMED — the PRD requires a responsive web app but names no specific width; 360px is this project's floor until specified otherwise]` Verify the component still functions and reads correctly down to a 360px-wide viewport.

## Code skeleton

```tsx
// Flagged span — color + non-color signal, identical everywhere it appears
function FlaggedSpan({ type, children }: { type: "LOW" | "GAP"; children: string }) {
  return (
    <span
      style={{
        background: "var(--color-error-container)",
        color: "var(--color-on-error-container)",
        padding: "var(--spacing-collection-extra-small-spacing)",
      }}
    >
      <FlagIcon aria-hidden="false" /> {/* non-color signal */}
      {children}
    </span>
  );
}

// Gap-filling note format when a token is missing
// [DESIGN-SYSTEM GAP] Needed: a warning-tier surface color between --color-surface
// and --color-error-container. Using --color-error-container as a stand-in for now.
```

## Traps

- Picking a hex value "close enough" to an existing token instead of using the variable.
- Using a different red/orange for a flag in one view than another.
- Relying on color alone to mark a `LOW`/`GAP` span with no icon or text signal.
- Reflowing a diagram to "make the page look better."
- Showing a "no watermark" preview from a cached plan value instead of live `Subscription` status.
- Introducing a new spacing or shadow value instead of the closest scale step.

## Verify before done

- [ ] No raw hex/px/font-family values in the component's styles.
- [ ] Any `LOW`/`GAP` flag uses the error token set plus a non-color signal, identically across views.
- [ ] Diagrams render at their recorded position, unmoved.
- [ ] Watermark preview reflects the live `Subscription` state, not a cached flag.
- [ ] Typography and spacing values all come from defined token roles/scale.
- [ ] Component remains usable at a 360px viewport width.

**Tests to write:** a test asserting flag rendering includes a non-color signal, not color alone; a test asserting the watermark preview matches `Subscription.status` for both `FREE` and `ACTIVE` `PRO`.