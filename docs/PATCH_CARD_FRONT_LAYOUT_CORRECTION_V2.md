# Card Front Layout Correction v2

This patch fixes the previous front card layout issue.

## Fixes
- Keeps `Membership No` label.
- Keeps member photo bigger, but balances the layout.
- Keeps the membership number box below the photo.
- Moves the designation panel higher so it does not touch/cut into the footer.
- Reduces designation panel height so 1 or 2 designations fit cleanly.
- Uses compact location text for central/central advisory designations.
- Prevents long designation location lines from expanding the card height.

## Changed files
- `src/components/MembershipCard.tsx`
- `src/lib/member-card-designation.ts`
