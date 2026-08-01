@echo off
REM Amit — process the local inbox once, triggered by AmitBooks' "Send
REM Selected to Local Processing" button. Event-triggered, not a timer —
REM this only ever runs because something was just sent. See
REM ComputerHealth\CLAUDE.md for the full design, the security reasoning
REM (each item's own .json metadata carries that USER's own Supabase
REM access token — never the service-role key), and the still-open
REM decision about exactly what unattended tool permissions this should
REM run with.
REM
REM REQUIRES Claude Code's CLI installed as "claude" on this computer —
REM not done yet as of this build. This will fail until that install
REM happens; that's expected, not a bug in this script.

claude -p "Read every image file and its matching .json metadata file in C:\Users\user1\AmitInbox. For each one: extract the vendor, date, amount, and any other relevant fields based on its 'mode' field (bill, receipt, contact, mileage, other). Use the access_token found in that item's own .json metadata file to write the extracted result back to Supabase — that token is scoped to one specific user's own data only; never use any admin or service-role credential for this. Once an item has been successfully written back, delete both its image file and its .json metadata file from the inbox. Report a summary of what was processed."
