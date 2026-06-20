# JAS card back designation clipping fix

## Problem

On the back side of the membership card, the `Member Information` panel could clip long designation text when a member has more than one active designation, for example:

- Finance Secretary / District President
- CEC Member / District President

The panel layout was using a compact 3-column grid with designation inside the same short row as other fields. The row height was too small for wrapped designation text.

## Fix

Updated `src/components/MembershipCard.tsx`:

- Increased the middle row height on the back-side card layout.
- Reordered `Member Information` fields to keep compact fields together.
- Moved `Designation` to a full-width row inside the panel.
- Added safe wrapping with a 2-line clamp for designation text.
- Kept the card size unchanged.

## Test

Run:

```bash
npm run check
npm run build
```

Then preview a member card with two designations assigned and confirm that the designation line is no longer cut on the back side.
