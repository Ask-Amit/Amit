# AmitScan - To-Do

Source: all items marked [from CLAUDE.md], gathered 2026-11-14. Nothing here has been re-verified against the code.

## Next session (Ryan's instruction 2026-08-02) [from CLAUDE.md]
- Two-tier processing: light pass first (look for explicit job/category/PO number), deep Scope breakdown only as fallback.
- Embedded "Ask Amit" dialogue via the local CLI (/amit-ask bridge endpoint).
- Cross-linked Document ID (MM-DD-YY-NNNNNNN) stamped on the image, shown in Working Scans with instruction "Circle the date on this receipt, then write #NNNNNNN beside it."

## Setup and blockers [from CLAUDE.md]
- Deploy the get-scan-link Edge Function via the Supabase Dashboard.
- Run the amitscan_captures migration in the SQL editor (unsure if finished).
- Install the Claude Code CLI on the machine so process_inbox.bat can run unattended (blocked).
- Same Connect Scan entry point in the Hub itself.

## Not yet built [from CLAUDE.md]
- Sync the local queue up to Supabase (unsure if finished: v1.05 Send to Amit appears to cover the upload).
- Review queue screen (prefilled vs blank, confirm/reassign).
- OCR/classification through a server-side Edge Function behind a paid subscription.
- Workflow Rules reuse (vendor-history autofill) plus PO-number lookup.
- Payment Source selection and cross-book liability auto-creation.
- mileage_log table with daily hub_entries memory dual-write.
- General Documents home for Other mode.
- Contact-mode categorization prompt.
- Write-back of processed results into AmitBooks real tables (use the item's own access_token, never the service key).

## Resolved
- Mode-first capture changed to classify-after-capture (v1.04).
- QR connect flow and install prompt built.
- AmitBooks Pending/Working Scans tabs and Scan Now via /scan built (2026-08-01).

## FROM THE HUB PURSUITS (added 2026-11-14; nothing was changed in the Hub)
- APP — Modify AmitScan: site-condition capture mode, in-app zoom/color editing, and project-folder/change-order linking into AmitBooks with document-control metadata [due 2026-11-30] [P3] - Requested by Ryan through AmitChat (team inbox, 2026-10-25). Scope beyond current AmitScan: (1) a site-condition capture mode; (2) in-app zoom and color editing; (3) project-folder and change-order linking into AmitBooks, with document-control metadata. [hub:6e38dec2-eedc-47b5-8536-f55fe904222b]
