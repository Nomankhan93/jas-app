# JAS Card Front Designation Fit Fix

## Issue
On the front side of the membership card, the `JAS Designations` panel could be clipped at the bottom when a member has two active designations, for example `Finance Secretary` and `District President`.

## Root Cause
The left column content was taller than the available printable card body:

- profile photo block was large
- member number panel had generous vertical padding
- designations panel was added below those blocks
- card body uses a fixed card height, so excess content was clipped near the footer

## Fix
Updated `src/components/MembershipCard.tsx` front card layout:

- reduced left column vertical spacing
- reduced profile photo block from `250px` to `224px`
- reduced member number panel padding and text size slightly
- made the designations panel more compact
- removed the restrictive `max-h` clipping from the designations panel

## Expected Result
Both active designations should now fit cleanly on the front card above the footer without being cut.
