# New Docs Page

Create a new documentation page for the Pulse docs site.

## What to build

$ARGUMENTS

## Steps — follow in order

### 1. Research
- Read `docs/src/lib/nav.js` to understand the full nav structure and find where the new page fits
- Read 2–3 adjacent pages (the pages that will be `prev`/`next` neighbours) to match tone, section depth, and helper usage (`h1`, `lead`, `section`, `sub`, `codeBlock`, `callout`, `table`)
- Read `docs/src/lib/layout.js` exported functions to confirm available helpers
- If the feature being documented has a source file (e.g. in `src/`), read it to ensure accuracy

### 2. Plan
Before writing any files, state:
- The route (e.g. `/request-bodies`)
- Where it sits in the nav (section, between which two pages)
- Sections the page will cover (IDs + titles)
- Any doc pages that need updating to link to or mention this page

Wait for approval if anything is uncertain.

### 3. Implement

**a) Write the page file** at `docs/src/pages/<name>.js`:
- Import from `../lib/layout.js`, `../lib/nav.js`, `../lib/highlight.js`
- Use `prevNext('/your-route')` for prev/next links
- Export a valid Pulse spec as `export default { route, meta, state, view }`
- `meta.styles` must be `['/docs.css']`
- Use `renderLayout({ currentHref, prev, next, content })` for the page body
- All code examples must use `${codeBlock(highlight(\`...\`, 'js'))}` — never raw `<pre>`
- Tables use `${table(['Col1', 'Col2'], [['val', 'val']])}`
- Callouts use `${callout('note|tip|warning|info', 'text')}`
- Section anchors use `${section('anchor-id', 'Section Title')}`

**b) Register in nav** — add the entry to `docs/src/lib/nav.js` in the correct position

**c) Verify syntax** — run `node --check docs/src/pages/<name>.js`

**d) Check neighbours** — read the prev and next pages. If they reference topics this new page covers, add a cross-link.

**e) Final check** — confirm the new route appears in `prevNext` output for its neighbours (the nav order drives prev/next automatically, so adding to NAV is sufficient).
