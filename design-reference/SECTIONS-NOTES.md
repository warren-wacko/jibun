# New section designs — notes for conversion

There is one folder per template: `NN-template/sections/index.html`. The page format is the same as the existing exports: a single 390-px file with sample content as placeholders. Each folder also has `preview-light.png` and `preview-dark.png`.

Every page shows each new section twice:

- a **FULL** version, with the maximum number of items and long text;
- a **SPARSE** version, with one item and the optional fields left out.

For video and booking, the second version instead shows a long or unknown host, because the only data is a URL. A spec caption above each section says where it sits on the page. The theme toggle in the top bar switches between light and dark. At the bottom, **"Inside the Starter layout"** shows the add-ons as they look on Starter pages. In the source `.dc.html` (canvas board "<Template> — New sections"), the sample data lives in `renderVals()` as `xxxFull` and `xxxSparse` arrays, so the data shapes are visible.

## Shared rules used everywhere

- **Video and booking** have only a URL. Their text ("Watch the video", "Book a time…") is fixed copy. The host comes from the URL (`host()`: strip the scheme and `www.`, fall back to the raw string) and is cut off with an ellipsis when it's too long. Neither section has a thumbnail, title, duration or times.
- **Song** has no cover art, progress bar or timer. Without a title or artist it falls back to "Listen on Spotify" (Magazine uses "Hear my song", Notebook uses "My song on Spotify").
- **Orgs** show initials badges. `initials()` skips small words (of, the, and, ng, sa). The role line is not drawn when the role is empty.
- **Services**: when there is no price, nothing is drawn on the right. Long prices wrap within about 46% of the width.
- **Resume**: when there is no label, it falls back to "Résumé / CV".
- **Colour on the accent**: wherever text or an icon sits on the accent, an `onAccent` / `onBrand` (black or white by contrast) or a "clash" fallback is computed. Several templates' existing helpers (`accentText`, `accentInk`, `brandInk`) fail AA with some accents. The new sections avoid them, and the existing designs were left unchanged.
- **Numbered templates** (Magazine "P. NN", Company "NN"): the numbers shown (07–11) assume the default six blocks. On the live page they should come from the section's position in the order.
- **Add-on tags**: video and booking are always paid add-ons, so they always show the ADD-ON tag. The other sections follow the template's existing rule (tagged from the 3rd pick onward).

## Placement per template

| Template | Section → sits after |
|---|---|
| 01 Pro Classic | video → Portfolio · booking → Connect · interests → Skills · orgs → Experience · song → About. Starter: video and booking after Connect. |
| 02 Pro Magazine | video P.07 → Selected Work · booking P.08 → Get in Touch · interests P.09 → In Brief · orgs P.10 → Experience · song P.11 → Elsewhere. Starter: after Connect, no page numbers. |
| 03 Pro Signature | video → Portfolio · booking → Connect · interests → Skills · orgs → Experience · song → About. Starter: video after About, booking after Connect. |
| 04 Pro Company | 07 video → Selected work · 08 booking → Get in touch · 09 interests → About or Skills · 10 orgs → Experience · 11 song → Interests or About. Starter: 05 video, 06 booking (fixed Navy and Inter, as the Starter ignores brand and font). |
| 05 Student Notebook | video → Projects · booking → before "Find me online" · gallery → Projects (horizontal polaroid scroller; a 2-column grid on Starter) · services → Skills · experience → Projects · stats → About / info tiles · interests → Skills · song → Wins & orgs. |
| 06 Social Bento | stats → hero grid · skills → interests band · portfolio → photo dump · services → portfolio · video → song record · experience → orgs · resume → orgs · booking → just above "Want my contact?". Starter: resume, video and booking between the grid and the contact tile. |
| 07 Social Scrapbook | stats → tagline, before the IG ticket · skills → interests tape · portfolio → photo dump · services → portfolio (receipt with no TOTAL line, since counts aren't data) · experience → orgs & clubs · video → song record · booking → video · resume → just before the contact note. Starter: video and booking between the receipt and the contact note. |
| 08 Social Minimalist | stats → interests band · portfolio → photo dump · services → portfolio · experience → orgs & clubs · skills → experience · resume → skills · video → "On repeat" · booking → résumé, before the contact tile. Starter: video and booking between "Also on" and the contact tile. |

## Things to watch

- Bento and Scrapbook: the full portfolio, services and experience lists (12, 20 and 15 items) make very tall blocks, roughly 1,500–1,900 px each.
- Bento portfolio and stats switch layout on odd or even item counts (the last tile goes full width). The rule is in `renderVals()`.
- Notebook stats: a single very long word can't wrap inside a narrow sticky note at 320 px, so it breaks mid-word.
- The gallery alt text doubles as the visible caption. The caption is `aria-hidden`, and the alt stays on the `<img>`.
- Accent tests used #F6E7A6 and #141414. For templates with a named-accent list, the palest and darkest names were used instead: Bento Butter/Cobalt, Scrapbook Butter/Tomato, Minimalist Pink/Forest.
