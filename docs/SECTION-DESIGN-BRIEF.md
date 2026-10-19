# Brief for Claude Design: the missing section designs

Paste this whole file into Claude Design, and attach the files named under each template. Goal: every optional section can be added to every template, so a client can pick any design and any add-on and it all shows.

Today a page can store 12 kinds of optional section, but each template only draws some of them. A section the template has no design for is saved and never drawn. This brief lists, per template, what is missing: **52 designs in total**. (A 13th kind, the contact form, is not built yet and is out of scope.)

## Priority

1. **video** and **booking**: paid add-ons that no template can draw yet (16 designs, 2 per template).
2. **gallery** for Student Notebook, and **resume** for the three social templates: paid add-ons with a gap (4 designs).
3. The free "pick 2" sections: services, experience, skills, stats, portfolio, interests, orgs, song (32 designs).

## Rules for every design

- **Match the template.** Same fonts, colours, shapes, spacing and tone as the template's existing page. Look at the attached files, and do not restyle anything that already exists.
- **Colours come from the theme.** Use the template's tokens (background, surface, text, muted text, border, and the page's accent). Never a fixed brand colour. It must work in light and dark, and with any accent (pale and near-black too). Text must keep AA contrast (4.5:1).
- **Starter and Standard.** Add-on sections (gallery, video, PDF, booking) also appear on pages that use the template's **Starter** design, so those four must look right inside the Starter layout as well as the Standard one. The other sections only appear in Standard.
- **Phone first.** Design at 390 px and check 320 px. Tap targets at least 44 px. No horizontal scrolling of the page.
- **Real data only.** Nothing may be invented: no fake counts, dates or labels. A section with no data is not drawn at all, and neither is an empty row, icon or button.
- **Handle the extremes.** For each section show a sparse version (one item) and a full version (the maximum). Long text wraps or truncates cleanly (a 30-character name, an 80-character title).
- **No scripts needed.** Pure HTML and CSS. A video is a link-out card (see below), not an embedded player.
- **Section position.** Sections sit between the template's existing blocks. The page owner can reorder them (Standard only), so each section must stand on its own, with its own heading in the template's heading style.

## The sections and the data each one gets

| Kind | Data | Notes |
|---|---|---|
| gallery | 1 to 10 images: `{url, alt (120)}` | The alt text is the caption. |
| portfolio | 1 to 12 items: `{title (80), url, desc (200, optional), thumbUrl (optional)}` | Each item links out. The thumbnail is often missing. |
| services | 1 to 20 items: `{name (80), price (40, optional)}` | The price is free text, for example "from ₱500". It may be missing. |
| resume | `{fileUrl, label (60, optional)}` | A download button; the label defaults to "Résumé / CV". |
| experience | 1 to 15 items: `{role (80), org (80), years (30)}` | A timeline or list. |
| skills | 1 to 30 text items (40 each) | Tags, bars-free (there are no levels). |
| stats | 1 to 6 items: `{label (40), value (30)}` | For example "Experience" and "8+ years". |
| video | `{url}` | A YouTube or Vimeo-style link. We only have the link: no thumbnail, title or length. Design a link-out card with a play button. |
| booking | `{url}` | A button or card that opens a booking page. Only a link: no times or availability. |
| interests | 1 to 20 text items (40 each) | |
| orgs | 1 to 12 items: `{name (80), role (60, optional)}` | The initials of the name can be used as a badge. |
| song | `{spotifyUrl, title (80, optional), artist (80, optional)}` | Opens Spotify. No cover art and no playback; do not draw a progress bar or timer. |

## What to design, per template

Each entry gives the template's character, the files to attach, what it already draws, and the designs to add. All files are under `design-reference/`.

### 1. Pro Classic (professional)
- **Look:** a holographic card that flips to a QR code, clean rounded cards, mono labels, an accent bar on section headings.
- **Attach:** `01-pro-classic/starter/index.html` and `01-pro-classic/standard/index.html`.
- **Already draws:** gallery, portfolio, services, resume, experience, skills, stats.
- **Add (5):** video, booking, interests, orgs, song.

### 2. Pro Magazine (professional)
- **Look:** editorial: full-bleed cover photo, a giant name, a drop-cap bio, "P. 01"-style page numbers on every block, a sticky Save Contact bar.
- **Attach:** `02-pro-magazine/starter/index.html` and `02-pro-magazine/standard/index.html`.
- **Already draws:** gallery, portfolio, services, resume, experience, skills, stats.
- **Add (5):** video, booking, interests, orgs, song. Each also gets a page number.

### 3. Pro Signature (professional)
- **Look:** a flip card, a ticker line of specialties, a handwritten signature, rounded cards with numbers.
- **Attach:** `03-pro-signature/starter/index.html` and `03-pro-signature/standard/index.html`.
- **Already draws:** gallery, portfolio, services, resume, experience, skills, stats.
- **Add (5):** video, booking, interests, orgs, song.

### 4. Pro Company (professional)
- **Look:** a company-logo slot, an arched photo, numbered boxed sections ("01", "02"), brand colour derived from the accent.
- **Attach:** `04-pro-company/starter/index.html` and `04-pro-company/standard/index.html`.
- **Already draws:** gallery, portfolio, services, resume, experience, skills, stats.
- **Add (5):** video, booking, interests, orgs, song. Each takes the next section number.

### 5. Student Notebook (student)
- **Look:** grid paper, a taped polaroid that flips to a QR code, sticky notes, a handwriting font, a highlighter underline.
- **Attach:** `05-student-notebook/starter/index.html` and `05-student-notebook/standard/index.html`.
- **Already draws:** portfolio (projects), skills (stickers), orgs (wins), resume (a button beside Save contact).
- **Add (8):** gallery, services, experience, stats, video, booking, interests, song.

### 6. Social Bento (social)
- **Look:** a bento grid of rounded 26 px tiles, a big follow tile, handwritten accents, mono labels.
- **Attach:** `06-social-bento/starter/index.html` and `06-social-bento/standard/index.html`.
- **Already draws:** interests (a scrolling band), song (a record), gallery (a photo dump), orgs (chips).
- **Add (8):** portfolio, services, resume, experience, skills, stats, video, booking.

### 7. Social Scrapbook (social)
- **Look:** torn paper, tape, cutout letters, kraft paper, a ticket and a receipt, hand-lettered headings.
- **Attach:** `07-social-scrapbook/starter/index.html` and `07-social-scrapbook/standard/index.html`.
- **Already draws:** interests (a tape strip), song (a record on kraft paper), gallery (taped polaroids), orgs (framed cards).
- **Add (8):** portfolio, services, resume, experience, skills, stats, video, booking.

### 8. Social Minimalist (social)
- **Look:** a huge first name, italic serif accents, hairlines, pill shapes, lots of space.
- **Attach:** `08-social-minimalist/starter/index.html` and `08-social-minimalist/standard/index.html`.
- **Already draws:** interests (big italic words), song (a record tile), gallery (small rounded cards), orgs (pills).
- **Add (8):** portfolio, services, resume, experience, skills, stats, video, booking.

## The full gap, at a glance

| Section | Classic | Magazine | Signature | Company | Notebook | Bento | Scrapbook | Minimalist | Missing in |
|---|---|---|---|---|---|---|---|---|---|
| gallery | have | have | have | have | **add** | have | have | have | 1 |
| portfolio | have | have | have | have | have | **add** | **add** | **add** | 3 |
| services | have | have | have | have | **add** | **add** | **add** | **add** | 5 |
| resume | have | have | have | have | have | **add** | **add** | **add** | 3 |
| experience | have | have | have | have | **add** | **add** | **add** | **add** | 5 |
| skills | have | have | have | have | have | **add** | **add** | **add** | 3 |
| stats | have | have | have | have | **add** | **add** | **add** | **add** | 5 |
| video | **add** | **add** | **add** | **add** | **add** | **add** | **add** | **add** | 8 |
| booking | **add** | **add** | **add** | **add** | **add** | **add** | **add** | **add** | 8 |
| interests | **add** | **add** | **add** | **add** | **add** | have | have | have | 5 |
| orgs | **add** | **add** | **add** | **add** | have | have | have | have | 4 |
| song | **add** | **add** | **add** | **add** | **add** | have | have | have | 5 |
| **Missing per template** | 5 | 5 | 5 | 5 | 8 | 8 | 8 | 8 | **52** |

## What to hand back

- **One HTML file per template**, in the same format as that template's existing `standard/index.html` (a single file, 390 px, sample content as placeholders), containing the new sections in addition to the existing page.
- For each new section: the full version, the sparse version, light and dark, and a note of which existing block it sits beside.
- Keep the file names clear (`NN-template/sections/index.html`) so they can be converted one template at a time.
- Do not change the existing designs. If a new section needs a new icon, draw it in the template's existing icon style.
