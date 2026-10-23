# Public Square

A static community priorities prototype with clearly labeled sample data.

- `v1.html`: original home screen with the text hero and live filters.
- `index.html`: V2 with a full-screen generated community image and bottom filter bar.
- `results.html`: V2 filtered list, preserving selections in the URL.

Use the compact header version switcher to compare V1 and V2. Both designs are self-contained HTML pages; no build or installation is required. The V2 image is AI-generated. No accounts, contributions, or live community data are connected.

Run from this directory with `python3 -m http.server 3000 --bind 0.0.0.0`.

`concern.html`: housing concern design with accessible Overview, Resident perspectives, Evidence & resources, and Public action tabs. Resident stories and action milestones are explicitly illustrative.

`map.html`: interactive state map with topic comparisons and synthetic example percentages. Geographic data: PublicaMundi/MappingAPI US states GeoJSON. No survey results are represented.

`priorities.html`: personal priority list (maximum 10). Selections are stored in localStorage on this browser/origin, synchronized across tabs, and never change illustrative community counts. Storage failures fall back to temporary page-only state with an explicit notice. No accounts or server sync.

All eight concerns now open `concern.html?id=concern-N` with topic-specific prototype content. The `back` parameter preserves list version, filters, and row anchor; only same-origin known list pages are accepted. Saved priorities link to each matching concern.

Map drill-down: select a state, then a sample city and ZIP; direct ZIP lookup supports the eight prototype ZIPs. Breadcrumbs and browser history preserve topic and location. Local views show a state locator silhouette, not fabricated city/ZIP boundaries. Unknown ZIPs and missing local coverage are explicitly reported.

State drill-down maps now include clickable city-center circles and approximate ZIP-location diamonds, with leader-line labels. Prototype locator coordinates are approximate; no city or ZIP boundaries are asserted.

`suggest.html`: Suggest a concern with title, description, topic, and national/state/city/ZIP scope; similar public sample concerns; safe text preview; and private browser drafts. Incomplete drafts can be saved, reopened, edited, and deleted. Drafts use the separate `public-square-drafts-v1` localStorage key and never change sample concerns, shared counts, or My Priorities. This is not public submission. Clearing site data removes drafts, and people sharing a browser profile may see them. Storage failures retain work on the page with an explicit warning; unreadable saved records are preserved rather than overwritten. Cross-tab changes require reloading or saving a separate copy.

Authoring uses `concerns.js` (sample catalog), `drafts.js` (isolated private store), `suggest.js`, and `suggest.css`. Existing pages remain self-contained. The authoring catalog currently mirrors the existing priority catalog; keep IDs and sample content aligned when editing the examples.

Product scope and pilot assumptions: `docs/PRODUCT_PLAN.md`.

Checks: `node --test tests/drafts.test.cjs`. For browser checks, start the local server above, then run `node tests/suggest.browser.cjs` with Playwright installed and Chromium available at `/usr/bin/chromium` (or set `CHROMIUM_PATH`). Browser checks use isolated browser profiles and do not touch personal drafts.
