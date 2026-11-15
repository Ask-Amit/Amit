# AmitScan - Design and tables

Read the section '## Tables' first when you only need the database tables. The other sections describe how the project is built; read them only when working on that part.

## Tables

AmitScan has no tables of its own; see AmitBooks.

## Build Notes

- Same visual language as AmitBooks (dark panel, gold accent) but deliberately smaller and simpler — a utility, not a dashboard.
- Service worker (`sw.js`) is network-first from day one, same fix AmitBooks needed after a real version-staleness bug traced to a cache-first strategy — don't repeat that mistake here.
- Independent sign-in is deliberate: unlike Computer Health (pure Hub-session rider), AmitScan has to work the moment someone installs it on a phone with no prior Hub visit.
- Not a replacement for AmitBooks' existing in-app Scan Receipt feature — that stays for in-app use. AmitScan is the lightweight, install-as-an-icon counterpart for the field.
