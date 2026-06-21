# Patch: Move front card designations into verification notice area

## Purpose

This patch removes the front-side **Verification Notice** panel from the JAS digital member card and places the member's JAS designations in that larger center-bottom area.

## Files changed

- `src/components/MembershipCard.tsx`

## What changed

- Removed the front-side Verification Notice box.
- Moved the `JAS Designations` panel from the left column to the center-bottom area.
- One designation now appears as a single centered large designation block.
- Two designations now appear as two equal side-by-side designation blocks.
- Member photo increased from `250x250` to `260x260`.
- Left column now contains only photo + member number, reducing clipping risk.
- Back-side verification instructions remain unchanged.

## Test checklist

1. Open a member card with one designation.
2. Confirm the designation appears in the center-bottom panel with proper alignment.
3. Open a member card with two designations.
4. Confirm both designations appear in two equal boxes.
5. Confirm the front card no longer shows the Verification Notice panel.
6. Confirm the member photo is slightly larger and still fits.
7. Run:

```bash
npm run check
npm run build
```
