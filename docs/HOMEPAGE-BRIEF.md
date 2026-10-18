# Brief for Claude Design: Jibun marketing homepage

Paste this whole file into Claude Design. Placeholders are written as `{{like-this}}`; the owner fills them in later.

## What Jibun is

A Philippine business that sells NFC digital cards. A person taps the card on a phone and their personal page opens: their name, links, and a Save Contact button. There is no app to install. The card works on any modern iPhone or Android, and every card also has a QR code as a backup.

**Tagline:** "Yourself, One tap away."
**Footer line:** "Digital card by Jibun".

## Audience

Three groups: working professionals, students and fresh graduates, and creators / social people. Most visitors arrive from a link in a chat or social post, on a phone. Design **mobile first (390 px)**, then a desktop layout (1280 px).

## Tone

Friendly, modern, confident, a little playful. English, with the occasional casual Filipino word. Short sentences.

## Hard rules

- **No prices and no checkout.** Every "get one" button goes to a contact action (placeholder `{{contact-link}}`). Do not invent numbers like "from ₱…". People message the owner to avail.
- No testimonials, client logos or statistics (none exist yet). If you show where they could go later, mark the slot clearly as a placeholder.
- No login or account area. No monthly-price language. "One-time payment" only in the wording given below.
- Sample cards show fictional people only.
- Performance and accessibility: Lighthouse mobile 90 or above, WCAG AA contrast, tap targets of at least 44 px. Light images (WebP or SVG), no autoplay video, at most two font families.
- Works in light mode; dark mode is welcome.

## Sections, in order

1. **Header.** "Jibun" wordmark (text is fine; there is no logo yet), links to How it works and FAQ, and a "Message us" button.
2. **Hero.** Headline "Yourself, One tap away." Subline such as "A digital card that opens your whole profile with a tap. No app needed." One main button, "Get your card" (goes to `{{contact-link}}`). One secondary link, "See how it works". Beside or below it, a phone mockup of a sample card, with a small illustration of a card tapping a phone.
3. **Why it beats a paper card.** Three to four short points: one tap or scan opens it; update it without reprinting; Save Contact puts your details straight into their phone; works for 4 years with no monthly fees.
4. **How it works.** Four steps with icons: (1) You message us and choose a design. (2) We build your page. (3) We give you your card, a plain card unless you ask for a customized printed one. (4) People tap and save your contact.
5. **Who it's for.** Three cards: Professionals (contact-first), Students (for job seekers and fresh grads), Creators (follow-first, socials at the top). Each with one sample mockup.
6. **Sample designs.** 4 to 6 phone mockups that look like real phone screenshots, as static images (not live pages): pro-classic, pro-magazine, student-notebook, social-bento, social-scrapbook, social-minimalist. A line such as "More designs available. Every design works for everyone." A light/dark toggle here is optional.
7. **Starter and Standard (no prices).** Two cards, compared by features:

   | | Starter | Standard |
   |---|---|---|
   | Choose from the launch designs | Yes | Yes |
   | Light or dark theme | Yes | Yes |
   | Colour | Preset palette and school colours | Any colour you like |
   | Fonts | Design default | Choose from 4 font pairs |
   | Extra sections (skills, services, stats, portfolio, experience, interests, orgs, song) | Add-ons only | Pick 2 included |
   | Reorder sections | No | Yes |
   | Revisions included | 1 | 2 |
   | Small edits in the first year | 2 | 4 |

   Under it: "Prices? Just message us." Then an **Add-ons** strip (names only, no prices): photo gallery, video, PDF / résumé download, booking button, tap and visit stats, custom domain, remove "Digital card by Jibun", one extra revision. A note: "Need something special? Ask for a custom quote."
   Both tiers come with a plain card; a customized printed card is made only on request.
8. **Your card, your 4 years.** A reassurance block with this exact wording: "One-time payment covers your card and page for 4 years, with no monthly or yearly fees. After 4 years, you can keep it active with a small renewal, or upgrade to a new card and design at a discount. We'll remind you before your term ends."
9. **FAQ** (accordion):
   - Do I need an app? No. It opens in the phone's browser.
   - Does it work on iPhone and Android? Yes, on modern phones. The QR code is the backup.
   - What if the other phone has no NFC? They scan the QR code.
   - Can I change my details later? Yes. You get revisions and small edits; more later are paid per request.
   - What happens after 4 years? Renew for a small fee, or upgrade. After a 30-day grace period a lapsed page shows a "please contact us" screen.
   - Can I upgrade Starter to Standard later? Yes. You keep your link and card and only pay the difference.
   - What if I lose my card? We can disable it and give you a new one.
   - Is my info safe? You choose what appears on your page. Taps are counted without storing anyone's IP address.
   - How do I pay? Orders are taken by message: {{payment-methods}}.
10. **Final call to action.** The tagline again, a "Message us to get yours" button, and contact channels: `{{messenger}}`, `{{instagram}}`, `{{email}}`, `{{phone}}`.
11. **Footer.** "Digital card by Jibun", the contact channels, and Privacy and Terms link placeholders (`{{privacy-link}}`, `{{terms-link}}`).

## Look and feel

The brand has no colours or logo yet: propose a palette and a simple wordmark. The sample cards have strong looks of their own, so keep the page background calm and let the mockups carry the colour. Rounded shapes, generous space, large friendly type.

## Deliverables

- One HTML page designed at 390 px, plus a 1280 px layout.
- Clear section ids: `#how-it-works`, `#designs`, `#plans`, `#faq`, `#contact`.
- All text as real text, not baked into images.
- Placeholders as `{{like-this}}` so they are easy to find.
