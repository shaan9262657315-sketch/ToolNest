# PDF Studio

A private, browser-based PDF editor. **Edit the text and tables that are already in a PDF**,
add new text, images and signatures, merge, split, rotate and reorder pages — without
uploading a single byte to anyone's server.

Most "free online PDF editor" sites work by uploading your document to a stranger's backend.
For contracts, invoices, ID scans and medical forms that is a genuine privacy problem.
PDF Studio does all the work locally in the browser — the app has no backend at all.

## Features

Every feature listed here is implemented and working.

**Edit the text that is already in the PDF**
- Click **✎ Edit text** and every text line on the page becomes clickable
- Click a line, retype it, press Enter — the document keeps the original position,
  font family, weight, size and colour, which are all detected from the file itself
- Where the encoding allows, the original glyphs are **deleted from the page's content
  stream**; otherwise the line is covered with the sampled page background (see Limitations)
- Leave the replacement empty to delete a line outright
- **Click any blank part of the page** to start typing there — no separate tool needed
- Longer replacements shrink to fit the original line width (down to 60% of the
  original size, then they are allowed to overflow rather than become unreadable)
- Every edit stays adjustable afterwards: text, font, size, colour, bold/italic,
  shrink-to-fit, and a one-click **Revert to original**
- **Extract text** dumps the whole document to a `.txt` file, page by page

**Edit tables**
- Tables are detected automatically — no need to draw a grid. Rows come from baseline
  clustering, columns from a horizontal projection profile, so both bordered and
  borderless tables work, and left- and right-aligned columns are handled alike
- Every cell is clickable, **including empty ones** — click and type
- **Insert a row** above or below any row; content below it reflows down the page
- **Insert a column** to the left or right of any column; the rest of the table shifts across
- **Delete a row or column**; the remaining content closes the gap
- Ruling lines are redrawn for tables that had them, and left alone for tables that did not

**Add new content**
- Text boxes with configurable size, colour and bold weight
- PNG/JPEG images placed anywhere, drag to move, drag the corner to resize
- A signature drawn on a canvas pad, auto-trimmed to the ink and placed as a transparent PNG
- Filled, semi-transparent boxes for highlighting or covering content

**Document assembly**
- Open one or more PDFs via the file picker or drag-and-drop
- Merge additional PDFs into the current document
- Reorder pages by dragging thumbnails
- Rotate, duplicate and delete individual pages
- Extract a page range (`1-3,7,10`) into a brand new PDF

**General**
- Multi-line text, inline editing, `Delete` to remove the selected item, `Esc` to leave edit mode
- Arrow keys page through the document; zoom from 25% to 400%
- Save the edited document as a new PDF, with page rotation preserved

## How the tricky parts work

**Coordinates.** Overlay annotations are positioned in viewport pixels at zoom 1 with the
page's rotation applied. `pdf.js`'s `viewport.convertToPdfPoint()` inverts both the scale and
the rotation, producing coordinates in the page's *unrotated* user space — which is the space
`pdf-lib` draws into. Drawing each item with `rotate: degrees(pageRotation)` then cancels out
the rotation the viewer applies, so text and images land upright on rotated pages.

**Text editing.** Existing-text geometry is computed in *unrotated* space, because that is the
only frame where baselines are horizontal and fragments can be grouped into lines reliably.
The hotspot layer is then rotated with a CSS transform to sit on top of the rendered canvas,
and replacements are written in unrotated space so they inherit the original text's orientation.

**Removing the old text.** `pdf-lib` has no text-editing API, so PDF Studio decodes the page's
content stream, scans it for string tokens (both `(literal)` and `<hex>` forms, including the
elements of `TJ` arrays), matches them against the line being replaced and blanks exactly those
tokens. A token is only blanked when *all* of its characters fall inside the match, so text that
merely shares an operator with your line is never destroyed. If the text cannot be located —
which is the norm for subset fonts with an Identity-H CMap, i.e. most PDFs produced by Word,
Chrome or LaTeX — the app falls back to covering the line with the sampled page background.

**Retired text.** A covered line is invisible but still present, and `getTextContent()` keeps
returning it. Left alone, it would reappear the moment a row or column shift redrew the region.
PDF Studio therefore records exactly which string it covered and where, and filters those
fragments out of every later text layer. Each record suppresses exactly one fragment, which
matters when a shift lands identical text on a retired spot — consuming the record leaves
precisely one copy visible instead of none or two.

**Composing structural edits.** Shifting content only works if "content" means the page as it
stands right now. Each structural edit therefore *bakes* first: pending items are flattened into
a real PDF that becomes the new source, and the text layer is rebuilt from it. The edit itself
is then kept live in memory, because a freshly inserted row holds no text and text-based
detection cannot see it.

**Colour matching.** The ink and background colours are sampled from the already-rendered
canvas: the darkest pixel inside the line box becomes the text colour, and the most common
pixel just outside it (quantised so anti-aliasing collapses into one bucket) becomes the
background used for the fallback cover.

## Run it

A static server is required — browsers refuse to start the pdf.js web worker from a
`file://` URL, so double-clicking `index.html` will not work.

```bash
npm start              # http://localhost:5173
npm start -- --port 8080
```

`server.js` is a ~70-line zero-dependency Node static server. Any other static server works too:

```bash
npx serve .
python -m http.server 5173
```

Node 18+ required. There is nothing to `npm install`.

## Monetization

Target customer: freelancers, small agencies, accountants, legal and HR teams who handle
sensitive documents and cannot use upload-based tools for compliance reasons.

- **Free** — everything in the feature list above, unlimited use, fully local.
  Documents over 50 pages surface the Pro dialog but are not blocked.
- **Pro (~$8/month or a one-time desktop licence)**
  - OCR, to make scanned PDFs searchable and editable
  - True redaction that removes the underlying text rather than covering it
  - AcroForm form filling and flattening
  - Batch mode across an entire folder
  - E-signature requests with an audit trail
- **Self-hosted / white-label licence** for firms that want it on their own intranet —
  the fact that it is a static bundle with no backend makes this an easy sell.

The privacy story is the wedge: "your files never leave your machine" is a claim the
upload-based incumbents structurally cannot make.

## Limitations

Stated plainly, because the alternative is a bad surprise on someone's contract:

- **Scanned PDFs have no text to edit.** If a page is an image, edit-text mode says so.
  Making scans editable requires OCR, which is a Pro feature.
- **Subset fonts fall back to covering.** Most real-world PDFs (Word, Chrome, LaTeX) embed
  subset fonts with an Identity-H CMap, so the original string cannot be located in the
  content stream. The edit looks right, but the old string is still inside the file and
  will show up in a text extraction. Removing it for good is what real redaction means,
  and it is deliberately a Pro feature rather than a false promise.
- **Ruling lines after several stacked edits.** One structural edit redraws a bordered
  table's grid correctly. Running several in a row on the same table can leave the grid
  un-restored — the *content* stays correct, but the borders may be missing. Save and
  reopen between structural edits if the borders matter.
- **Inserting a row reflows the block below it**, not the whole page. Content separated by
  a large vertical gap (footers, page numbers) deliberately stays put.
- **Replacements use the standard PDF fonts** (Helvetica / Times / Courier families).
  The weight, slant and size are matched, but an exotic embedded typeface will not be
  reproduced glyph-for-glyph. Custom font embedding is a Pro feature.
- **Text does not re-wrap.** Editing a line changes that line only; paragraphs are not re-flowed.
- **Encrypted / password-protected PDFs are not supported** (`pdf-lib` cannot decrypt them).

## Verification

Because this is a UI, it is tested through a real browser (Edge, driven by Playwright) as
well as headlessly. That matters: an earlier build passed every headless test while being
completely unusable, because an overlay covered the page and swallowed every click. Only a
real browser catches that class of bug.

The suites cover, against a Chrome-generated invoice PDF with subset fonts and a bordered table:

- the page renders, lines are detected, and a click at a line actually reaches the hotspot
- editing a line, committing it, and finding the new text in the saved PDF
- table detection shape (a 4×2 address block, a 5×4 line-item table, a 3×2 totals block)
- editing a filled cell, typing into an empty cell, and typing in blank space
- inserting a row, inserting a column, deleting a row — and the new text landing in the output
- text-layer alignment at 0°, 90°, 180° and 270°
- overlay annotations still placing to <0.75 px at every rotation
- no uncaught page errors throughout

37 browser checks currently pass, and the rendered output is inspected visually rather than
only asserted on.

## Tech

Vanilla JavaScript, no framework, no build step, no `npm install`.
Two vendored libraries are committed in `vendor/` so the app works offline:

| Library | Version | Purpose | Licence |
| --- | --- | --- | --- |
| [pdf-lib](https://github.com/Hopding/pdf-lib) | 1.17.1 | Writing the output PDF | MIT |
| [PDF.js](https://github.com/mozilla/pdf.js) | 3.11.174 | Rendering pages for preview | Apache-2.0 |

See [`vendor/LICENSES.md`](vendor/LICENSES.md) for the full licence texts.

## Licence

MIT — see [LICENSE](LICENSE).
