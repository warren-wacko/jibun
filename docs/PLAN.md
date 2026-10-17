# Development Plan: NFC Card Platform

Source of truth: [PRD.md](PRD.md). Phases follow the PRD milestones (M1–M5) with an added Phase 0.
Product scopes from the PRD are called v1 / v2 / v3 here to avoid clashing with these build phases.
Rule: one phase per session; review and pass the gate before starting the next.

## Phase 0: Project setup
- [x] Save PRD as `docs/PRD.md`
- [x] Update `.claude/CLAUDE.md` with conventions: strict TypeScript, Zod at boundaries, no client data or hex colors in templates, `placeholder` template until a reference file exists
- [x] `git init` on `main` (the `release` branch is created after the first commit, since a branch needs a commit)
- [x] Decide blocking open questions: image storage = Cloudinary; brand = Jibun (自分). Domain still open (needed before Phase 2 deploy)
- **Gate:** repo initialized, conventions documented

## Phase 1 (M1): Foundation
- [x] Scaffold Next.js (App Router) + TypeScript strict + Tailwind + Prisma; `.env.example`
- [x] Prisma schema written (Prisma 7: `prisma.config.ts`, pg driver adapter)
- [x] First migration applied to Neon (`20261014175100_init`)
- [x] `lib/page-schema.ts` (Zod `PageData`), `lib/entitlements.ts`, `lib/socials.ts`, `lib/usage.ts`, plus `plan-term`, `accents`, `card-code`, `usernames`, with Vitest tests (61 passing)
- [x] `styles/themes.css`: light/dark variable sets; accent presets in `lib/accents.ts`
- [x] `placeholder` template and template registry
- [x] Seed script written and run (`npm run db:seed`): sample page `/maria` with one card code
- **Gate:** tests pass; seeded data validates and renders in the placeholder

## Phase 2 (M2): Public page and tap flow
- [x] Shared components: ActionRow, SaveContact, SocialGrid, FeaturedLink, Footer (+ client components for QR toggle, share, theme toggle)
- [x] `/[username]` (cached with `use cache`, expired on admin save via `revalidatePage`), `/[username]/vcard`, `/[username]/qr`
- [x] `/inactive`, `robots.txt`, `noindex`, Open Graph tags
- [x] `/c/[code]`: status checks, non-blocking tap logging (`after`), 10-minute de-dup, bot filtering, rate limit (~30/min/IP), 302 redirect
- [x] Convert `pro-classic` Starter from `design-reference/01-pro-classic/starter/` (verified against the reference at 390/375/320 px, light and dark; QR decodes). Its Standard sections come from `01-pro-classic/standard/` in Phase 4
- [ ] Missing brand glyphs (YouTube, X, Spotify, Pinterest, GitHub, LinkedIn variants, Telegram, Discord, website): add to `components/brand-glyphs.ts` as the templates that contain them are converted; until then they show a neutral link icon
- **Gate:** tap → page → Save Contact works locally with the real card, against the seeded page. The real-phone and NFC tag test moves to Phase 5 with the Hostinger deploy

## Phase 3 (M3): Admin panel
- [x] Admin login: email + bcrypt password, signed httpOnly session cookie (`jose`, 7 days, instead of Auth.js: one admin, no OAuth needed), `proxy.ts` on `/admin/*` only, `requireAdmin()` in every page and action, login rate limiting (10/IP and 5/email per 15 min), `npm run admin:create`
- [x] Clients list at `/admin/clients`: search (name, username, email), tier/status/usage filters, sort, paging (25), `paidUntil` and last-tapped columns, usage and renewal badges; filters are a plain GET form so every view has a URL
- [x] New/edit page form at `/admin/pages/new` and `/admin/pages/[username]`: driven by `getEntitlements` (tier, accent, fonts, banner, custom templates), username suggestion and availability check, status and paid-until, add-ons; live phone-width preview (the real template in an iframe, 320-430 px, light/dark); one shared validator for the client and the Server Action; optional sections are kept as they are until the Standard templates exist
- [x] Social link editor (add, remove, reorder, links built from handles, tile notes)
- [x] Image fields (photo, logo): paste a link, with a thumbnail preview and a disabled "Upload and crop" button as the placeholder. The real upload moves to the last step (needs the Cloudinary account)
- [x] Cards (panel on the edit page, saves at once): code generation (unambiguous alphabet), chip link and QR link with copy, per-card QR (SVG, PNG download), disable / mark lost / turn on, spare cards (max 10), rename, reset usage (deletes the card's taps and recomputes the page's last tap), delete a never-used card; per-card and page tap totals. Checked with real taps: a lost or disabled card shows the inactive page, and the page QR moves to the next active card
- [x] Renewals screen (`/admin/renewals`: terms ending within 30 days or already ended, with stage badges for due / grace / lapsed, reminder-sent mark, ready-made reminder email, renew +4 years, mark inactive, edit counter) and dashboard (`/admin`: active pages, taps this week, renewals due, drafts, live pages by usage status with links to the filtered list, next renewals). The edit counter is also on the page editor
- **Gate:** a Starter client is created in under 10 minutes with no code changes

## Phase 4 (M4): Templates and Standard
- [x] Template preview at `/preview` (dev only) with fictional sample data, light/dark, full/sparse, any accent via `?accent=`
- [x] `pro-magazine` Starter converted (positions match the reference exactly at 390 px; 30-character names fit on two lines; QR dialog decodes)
- [x] `pro-signature` Starter converted (positions match the reference; flip card QR decodes; handwritten signature; light-theme footer text darkened one step to meet AA)
- [x] `pro-company` Starter converted (positions match the reference exactly at 390 px; brand colours derived in CSS from any accent; light-accent and no-photo cases handled). The Standard file of this design adds optional sections (services, experience, skills, stats, gallery, portfolio, résumé) and 4 font pairs: those come with the Standard package below
- [x] `student-notebook` Starter converted (positions match the reference to 0.1 px at 390 px; polaroid scene scales down to 320 px; dark school colours handled). Its Standard file adds extra sections: Phase 4
- [x] `social-bento` Starter converted (tile positions and sizes match the reference exactly at 390 px; the tile layout adapts to whichever links exist and never leaves a gap). Its Standard package (interests marquee, music record, photo dump, orgs & clubs) comes in Phase 4
- [x] `social-scrapbook` Starter converted (positions match the reference to 0.1 px at 390 px; cutout-letter name scales and wraps in balanced rows for names up to 30 characters). Its Standard package (interest tape, record, photo dump, orgs) comes in Phase 4
- [x] `social-minimalist` Starter converted (the 8th and last launch template). Its Standard package (interests marquee, record player, photo dump, orgs & clubs) comes in Phase 4
- [x] Accent palette and school color presets (in `lib/accents.ts`, picked in the editor)
- [ ] Standard sections with styled variants per launch template
- [x] Optional-section editor on the edit page: every section kind except the contact form (services, experience, skills, stats, portfolio, gallery, résumé, video, booking, interests, orgs, song) with row/line/link editing, the Standard "pick 2" rule and add-on unlocks explained in the picker, and reordering (`style.sectionOrder`, Standard and up) across a template's built-in blocks and sections. Templates do not draw sections yet; the editor says so until they are converted
- [x] Font pairs: the pairs from the Standard designs per template (three alternatives on each of the four professional templates, none on the student and social ones), a picker in the editor (Standard and up, cleared when the template changes), and validation that a pair belongs to the template. Templates apply the chosen pair when their Standard design is converted
- [x] Tier change on the edit page: changing an existing page's tier asks for the amount paid (whole pesos) and whether a new printed card is included, and saves them with the page in one transaction (`TierChange` history table, shown on the edit page). Content is re-checked against the new tier, so a downgrade cannot keep a custom colour
- **Gate:** every template renders with any subset of data in both themes at 320/375 px; AA contrast

## Phase 5 (M5): Launch polish
- [ ] Marketing homepage: offer, tiers, sample cards, contact
- [ ] Lighthouse mobile ≥ 90 (performance and accessibility)
- [ ] Playwright tests: tap → page → vCard
- [ ] Production checklist: env vars, backups, hosting resource monitoring
- [ ] **Last step (everything that needs an account or the domain):**
  - [ ] Cloudinary account and keys; build the image upload with crop in the editor (replaces the placeholder), and check photos still reach the vCard
  - [ ] Buy Hostinger + domain; set `NEXT_PUBLIC_SITE_URL` and the other env vars; deploy `release`
  - [ ] Create the real admin account on the live site (`npm run admin:create`)
  - [ ] Write a real NFC tag; test tap, QR and Save Contact on a real iPhone and Android
- **Gate:** launch-ready

## Later
- v2: analytics screen, contact form with rate limiting, custom domains via middleware, remove-branding add-on, static export
- v3: client/org dashboards, team cards, digital menus, product and event pages

## Open questions (from PRD)
- Domain for Jibun (replaces `tapcard.ph`); needed only for the final deploy (Phase 5)
- Cloudinary account and API keys; needed in the last step (image upload replaces the placeholder)
- ~~Brand name~~ decided: Jibun
- Renewal fee (draft ₱300–500)
- Final prices (draft Starter ₱1,200 pro / ₱1,000 student)
- ~~Image storage~~ decided: Cloudinary
- Reprint policy on Starter → Standard upgrade
- Grace period length (draft 30 days)
- Order of the five drop templates

## Notes
- PRD file tree lists `pro-centered` and `social-pop`; the template table is authoritative.
- No template is invented before its reference file exists; use `placeholder`.
- Reference designs live in `design-reference/[nn]-[templateKey]/{starter,standard}/index.html`. Never edit them.
