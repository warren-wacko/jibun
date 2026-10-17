# Change reporting

- After every task that edits, creates, or deletes files, end your reply with a
  "Changes" section listing each file touched and a one-line description of what changed.
- Before making changes, briefly state the plan, then ask for a confirmation.

# Project context

- Product spec: `docs/PRD.md` is the source of truth. The root `PRD NFC Card Platform.md` is an outdated copy (it still has the Premium tier); do not use or edit it.
- Build plan and phase gates: `docs/PLAN.md`.
- Work one phase per session; finish its gate before starting the next.
- Brand is **Jibun** (the PRD's `[brand]` placeholder); footer reads "Digital card by Jibun". Domain is not chosen yet: keep `tapcard.ph` as a placeholder in config, never hardcode it in app code.
- Image storage is Cloudinary. No account yet; keep credentials as env vars and code against placeholders until they exist.
- If the PRD and the plan disagree, the PRD's template table and route table win.

# Conventions

- TypeScript strict mode. Zod validates `PageData` on write and on read, and all other boundary input.
- Templates are React components that receive `PageData` and a theme. No client data inside templates; no per-client files except `custom-[slug]` components (CUSTOM tier, quoted work set by the admin only). Public tiers are Starter and Standard only.
- No hex values in template files; colors come from the theme CSS variables (`--bg`, `--surface`, `--text`, `--text-muted`, `--accent`, `--border`).
- Tier rules live in `lib/entitlements.ts` (`getEntitlements`); never branch on tier inside templates.
- Hide any section, grid, tile or button with no data. Never show empty icons.
- Tap logging must never block the `/c/[code]` redirect. Store no IP addresses.
- Secrets only in environment variables; keep `.env.example` current. Keep host-specific settings out of app code.
- This is Next.js 16 with Cache Components on (`cacheComponents: true`). Cache data with `'use cache'` + `cacheLife` + `cacheTag`, not `unstable_cache` or `export const revalidate`. Render code cannot read the clock or runtime APIs outside `<Suspense>`. Read `node_modules/next/dist/docs/` before writing routing or caching code.
- Never commit or push unless asked. Production branch is `release`; daily work is on `main`.

# Templates

- Reference designs are in `design-reference/[nn]-[templateKey]/{starter,standard}/index.html` (8 launch templates). Do not invent a design that has no folder there: use the `placeholder` template.
- Template conversion notes (learned on `pro-classic`, see `src/templates/pro-classic/`):
  - Each template has its own folder: `index.tsx` (server), `interactive.tsx` (client bits), `model.ts` (PageData to view data, unit tested), `fonts.ts` (`next/font`), and a scoped `.css` that holds all tokens. Register it in `src/templates/registry.ts` and add its fonts to `src/test/setup.ts`.
  - Tailwind's base sets `line-height: 1.5` and `box-sizing: border-box` everywhere; the exports assume browser defaults. Set `line-height: normal` on the template root and use `content-box` where the reference does. Use `:where(.root) a` for resets so component classes can set colours.
  - View any template with fictional data at `/preview` (dev only; `ENABLE_PREVIEW=1` allows it in production). When you convert a template, add its default accent to `PREVIEW_DEFAULT_ACCENT` in `src/lib/preview.ts`; `src/lib/preview.test.tsx` renders every registered template with full and sparse data in both themes.
  - Verify visually: run a production build, drive Chrome with `puppeteer-core` at 390/375/320 px (headless `--window-size` cannot go below ~500 px), and compare element positions to the reference file in both themes. Test sparse data and a 30-character name.
  - Tailwind's reset also zeroes `margin` (a native `<dialog>` then opens in the top-left: set `margin: auto`) and sets `button`/`a` styles; check modals and any element that relied on browser defaults.
  - Shared logic lives in `src/templates/shared/model.ts` (featured link, `displayUrl`), `src/components/Toast.tsx`, `src/lib/phone.ts`. Size big display text from real glyph widths (see `headlineEm` in `pro-magazine/model.ts`), not character counts. Use `data-weak-on-light` / `data-weak-on-dark` (set by `ThemeScope`) when an accent must be used as text.
  - No gear/settings controls, no per-template colour pickers, and no client-side QR or vCard code: use the app's `/qr` and `/vcard` routes.
- Convert a reference file only following the PRD "Conversion rules". Never edit the reference HTML. Hosting (Hostinger) is the last step of the plan; do not start it before then.

# Admin

- Every admin page and Server Action calls `requireAdmin()` (`lib/admin/auth.ts`); the proxy only checks the cookie signature. Read it inside `<Suspense>`.
- Page forms are validated by one function, `validateForm` in `lib/admin/page-form.ts`, used by the editor (live errors) and by `savePage` (`lib/admin/page-save.ts`), which re-validates. Tier rules go through `getEntitlements`; never trust the form.
- The editor preview is an iframe (`/admin/preview-frame`) that renders templates through a Server Action; its page imports the template registry so the templates' client components and CSS are in its bundle.
- Test the admin in Chrome with a throwaway admin user, and delete it and any test pages afterwards.

# Standard designs

- A template draws its Starter or its Standard design from `meta.design` (set from `getEntitlements`, never from the tier). Starter stays a fixed layout; Standard follows `style.sectionOrder` through `resolveOrder` (`templates/section-order.ts`), draws the section kinds listed in `templates/supported-sections.ts` and applies a font pair listed in `templates/font-pairs.ts`. Unsupported kinds are saved but not drawn.
- Template-specific CSS switches on `[data-design="standard"]` and `[data-font-pair="..."]` (pass them to `ThemeScope` through `attrs`). Fonts for the pairs use `next/font` with `preload: false` and literal options (no spreads).
- Template fonts use `preload: false` (literal options). Without it every page preloads the fonts of all eight templates, about 0.5 MB on a phone.
- Accent as small text or as a graphic: use `--accent-text` / `--accent-graphic` tokens built from `data-weak-text-on-*` and `data-weak-on-*`, never the raw accent.
- View the Standard design at `/preview/<template>?design=standard&font=<pair>&order=a,b,c`. Verify against the reference by applying its content to the sample page `/maria` with tier STANDARD, comparing block positions and total height at 390 px, and restore `/maria` afterwards.
