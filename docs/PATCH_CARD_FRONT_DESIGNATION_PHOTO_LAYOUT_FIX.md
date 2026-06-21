# JAS Card Front Designation + Photo Layout Fix

## Purpose

Fix front-side membership card layout when a member has one or two active designations.

## Changes

- Increased the member photo size from 224x224 to 250x250.
- Increased the left column width to safely fit the larger photo and designation block.
- Moved the designation rendering into a dedicated `CardDesignationPanel` component.
- Added separate layout behavior for:
  - one designation: a single centered designation card
  - two designations: two compact, evenly aligned rows
- Reduced the QR column width slightly so the overall card remains within the fixed card size.
- Prevented designation rows from being clipped by using fixed safe minimum heights and compact spacing.

## Files changed

- `src/components/MembershipCard.tsx`

## Test checklist

1. Open an approved member with one designation.
2. Confirm the single designation appears centered under Member No.
3. Open an approved member with two designations.
4. Confirm both designations are aligned and not clipped.
5. Confirm the member photo/logo block appears slightly larger.
6. Export/download card and confirm the same layout appears in the image.
