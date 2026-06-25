# Patch: Rename visible branding to Jatt Alliance Sindh Welfare

## Scope

This patch updates the public/member/admin-facing brand from **Jatt Alliance Sindh** / **JAS** to **Jatt Alliance Sindh Welfare** / **JASW**.

Updated areas include:

- Home page and navigation labels
- Membership card and office bearer card visible titles
- Admin shell/sidebar and admin dashboard copy
- Public About, Manifesto, Constitution, CWC, Committees, News, Events and Gallery copy
- Verify pages and QR verification messages
- Program pages, donation/donor copy and report headers
- PWA manifest, install/update/offline/notification text
- SEO/meta titles and README title

## Deliberately unchanged

To avoid breaking existing records and QR links, this patch does **not** rename technical/internal values such as:

- Project/repo/package name: `jas-app`
- Public asset folder: `/jas/...`
- Database tables or migrations
- Existing member number prefix examples like `JAS-2026-0001`
- Office bearer ID prefix like `JAS-OB-...`
- Existing service worker cache message keys such as `CLEAR_JAS_CACHE`

## Verification

Ran successfully after installing dependencies locally:

```bash
npm run check
npm run build
```
