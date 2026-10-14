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
- [ ] Shared components: ActionRow, SaveContact, SocialGrid, FeaturedLink, Footer (+ client components for QR toggle, copy, share)
- [ ] `/[username]` (server-rendered, cached, on-demand revalidation), `/[username]/vcard`, `/[username]/qr`
- [ ] `/c/[code]`: status checks, non-blocking tap logging, 10-minute de-dup, bot filtering, rate limit (~30/min/IP), 302 redirect
- [ ] `/inactive`, `robots.txt`, `noindex`, Open Graph tags
- [ ] Convert `pro-classic` when `starter-package-professional-template-1.html` arrives
- [ ] Deploy `release` to Hostinger, connect domain, write a real NFC tag
- **Gate:** tap → page → Save Contact works on a real iPhone and Android; QR scans

## Phase 3 (M3): Admin panel
- [ ] Auth.js credentials login, bcrypt, middleware on `/admin/*` only, login rate limiting
- [ ] Clients list: search, tier/status/usage filters, `paidUntil` and last-tapped columns, usage badges
- [ ] New/edit page form driven by `getEntitlements`; live phone-width preview with light/dark switch
- [ ] Image upload with crop; social link editor (add, remove, reorder)
- [ ] Cards: code generation (unambiguous alphabet), chip URL copy, QR, lost/disabled, spare, reset usage
- [ ] Renewals screen, edit counter, reminder-sent marker; dashboard
- **Gate:** a Starter client is created in under 10 minutes with no code changes

## Phase 4 (M4): Templates and Standard
- [ ] Convert, one per session, as reference files arrive: `pro-magazine`, `pro-signature`, `pro-company`, `student-notebook`, `social-bento`, `social-scrapbook`
- [ ] Accent palette and school color presets
- [ ] Standard sections with styled variants per launch template
- [ ] Font pairs and section reordering
- [ ] Tier upgrade on the edit page (amount paid, reprint flag)
- **Gate:** every template renders with any subset of data in both themes at 320/375 px; AA contrast

## Phase 5 (M5): Launch polish
- [ ] Marketing homepage: offer, tiers, sample cards, contact
- [ ] Lighthouse mobile ≥ 90 (performance and accessibility)
- [ ] Playwright tests: tap → page → vCard
- [ ] Production checklist: env vars, backups, hosting resource monitoring
- **Gate:** launch-ready

## Later
- v2: analytics screen, contact form with rate limiting, custom domains via middleware, remove-branding add-on, static export
- v3: client/org dashboards, team cards, digital menus, product and event pages

## Open questions (from PRD)
- Domain for Jibun (replaces `tapcard.ph`); needed before the Phase 2 deploy
- Cloudinary account and API keys; needed in Phase 3 (image upload)
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
