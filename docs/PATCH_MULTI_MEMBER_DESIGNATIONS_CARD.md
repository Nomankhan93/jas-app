# Multi Member Designations on JAS Card

This patch allows an approved JAS member to show multiple active organization designations on the digital membership card and the public QR verification page.

## Example

A single member can now be displayed as:

- CEC Member — Central Executive Committee
- District President — District Umerkot

## Important behavior

- Existing assignment flow already supports assigning the same member in different committees.
- Duplicate active assignment in the same committee remains blocked from the admin member detail quick form.
- The membership card prints up to 2 active designations to keep the design clean.
- The public QR verification page can show multiple active designations.
- Sorting order is:
  1. Central Executive Committee
  2. Central Advisory Committee
  3. Provincial
  4. Divisional
  5. District
  6. Taluka

## Files changed

- `src/lib/member-card-designation.ts`
- `src/components/MembershipCard.tsx`
- `src/routes/card.tsx`
- `src/routes/admin/members/$id/card.tsx`
- `src/lib/verify/actions.ts`
- `src/routes/verify/$memberNo.tsx`
- `supabase/migrations/20260620143000_multi_member_designations_card_support.sql`

## Apply and test

```bash
cd ~/projects/jas-app
unzip -o /mnt/c/Users/*/Downloads/jas-multi-member-designations-card-patch.zip -d .
npx supabase db push
npm run check
npm run build
```

## Test checklist

1. Open an approved member in Admin.
2. Assign one Central Executive Committee designation.
3. Assign one District designation to the same member.
4. Open the member card preview.
5. Confirm both designations show on the card.
6. Open the public QR verification URL.
7. Confirm both active designations show on the verification page.
