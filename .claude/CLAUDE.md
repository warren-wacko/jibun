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

- No design reference files exist yet. Do not invent a template's design: use the `placeholder` template until its file is in `design-reference/`.
- Convert a reference file only following the PRD "Conversion rules". Never edit the reference HTML.
