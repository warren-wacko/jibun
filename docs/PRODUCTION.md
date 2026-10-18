# Production checklist

For the person running Jibun. Nothing here is done yet: hosting is the last step of `docs/PLAN.md`. Come back to this file when the Hostinger account and the domain exist.

## 1. Environment variables

Set these in the Hostinger panel (never in the repo). `.env.example` lists the same names.

| Variable | Needed | What it is |
|---|---|---|
| `DATABASE_URL` | yes | Neon **pooled** connection string (the host contains `-pooler`). The app uses this. |
| `DIRECT_URL` | yes | Neon **direct** connection string (no `-pooler`). Prisma Migrate and the admin script use this. |
| `AUTH_SECRET` | yes | Random string of 32+ characters that signs admin logins. Generate with `openssl rand -base64 48`. Changing it logs every admin out. |
| `NEXT_PUBLIC_SITE_URL` | yes | The real address, for example `https://yourdomain.ph`, with no trailing slash. It goes into QR codes, vCards and share links. **It is baked in at build time**: set it before the build, and rebuild if it changes. If it is missing the app falls back to the `tapcard.ph` placeholder. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | **yes, before launch** | Shown on the "inactive" page and on the homepage. Baked in at build time. If unset the homepage shows the dummy `hello@jibun.example`. |
| `NEXT_PUBLIC_CONTACT_MESSENGER`, `NEXT_PUBLIC_CONTACT_INSTAGRAM`, `NEXT_PUBLIC_CONTACT_PHONE` | **yes, before launch** | The homepage's "Message us" buttons and contact cards. Full links for Messenger and Instagram (for example `https://m.me/yourpage`), a phone number with country code. Dummy values (`m.me/jibun.ph`, `+63 900 000 0000`) show until set. |
| `NEXT_PUBLIC_CONTACT_PAYMENT_METHODS` | optional | Text in the FAQ answer "How do I pay?" (for example `GCash or Maya`). |
| `NEXT_PUBLIC_PRIVACY_URL`, `NEXT_PUBLIC_TERMS_URL` | optional | Footer links on the homepage. Optional: they go to the built-in `/privacy` and `/terms` pages unless you set a URL. |
| `ENABLE_PREVIEW` | no | Leave **unset** in production. `1` opens the `/preview` template gallery to the public. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | later | Not read by the code yet. They are needed when image upload is built (last step of the plan). |

`NODE_ENV` is set to `production` by `next build` / `next start`; it turns on secure admin cookies.

The Privacy and Terms pages (`src/lib/legal.ts`) are plain-language drafts written from how the app works today, and they use `NEXT_PUBLIC_CONTACT_EMAIL` as the contact. Have them checked before launch, and update them (and the date) when the service changes, for example when photo upload or a contact form is added.

## 2. Before every deploy to `release`

1. On `main`: `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e` all pass.
2. If the database schema changed: run `npx prisma migrate deploy` against the production database (uses `DIRECT_URL`). The Hostinger build does **not** run migrations for you.
3. Never run `npm run db:seed` in production: it creates a sample page (`/maria`) with sample card codes.
4. Merge `main` into `release`. Hostinger builds (`next build`) and runs (`next start`).
5. After the deploy, open `/` (the homepage: check the contact buttons are yours, not the dummy ones) and `/inactive`, then tap-test one real card.

## 3. First-time setup (once)

1. Create the Hostinger Node.js web app from the GitHub repo, production branch `release`. Node 22.
2. Set the environment variables above, then deploy.
3. Run `npx prisma migrate deploy` against the production Neon database.
4. Create the admin account: `npm run admin:create` with `DIRECT_URL` pointing at production (choose a password of 12+ characters).
5. Point the domain at the app and check HTTPS works.
6. Create one real client and card in `/admin`, write the NFC tag, and test on an iPhone and an Android: tap, QR scan, Save Contact.

## 4. Backups

- The database is the only thing that cannot be rebuilt: clients, pages, cards, tap history and tier changes. The code is in GitHub.
- Neon keeps a short restore history on the free plan. Check the current window in the Neon console under Backup and restore, and know how to restore to a point in time before you need it.
- Do not rely on that alone. Once a week, and before any migration, save a copy:
  `pg_dump "$DIRECT_URL" --format=custom --file=jibun-YYYY-MM-DD.dump`
  Keep copies somewhere that is not the Neon account or the Hostinger account (for example a private cloud folder).
- **Decide:** how often, and where to keep the copies. (Open item.)
- Test a restore once into a throwaway Neon branch, so you know it works.
- Client photos will live in Cloudinary once upload exists; the photo links are in the database.

## 5. Monitoring

- **First month:** open the Hostinger panel once a week and look at CPU, memory and restarts. If limits are hit, move up a plan (PRD, hosting section).
- **Uptime:** add a free uptime check (UptimeRobot or similar) on `https://yourdomain.ph/inactive`. It needs no database and no login. Alert by email.
- **Database:** in the Neon console, watch storage and compute hours against the free plan.
- **Rate limits** are kept in memory inside the one Node process: they reset when the app restarts, and would not be shared if the app ever runs as more than one instance.
- **Taps** are logged without IP addresses. The tap log never delays the redirect; if logging fails the tap still works.

## 6. Renewals and housekeeping

- `/admin/renewals` lists terms ending within 30 days. Check it weekly.
- A page whose term ended shows the inactive screen after a 30-day grace period (the length is an open decision in the PRD).
- When a client renews: Renew +4 years on their page. No card needs rewriting.

## 7. If something breaks

| Symptom | Check |
|---|---|
| Every page is a 500 | `DATABASE_URL` correct? Neon project not suspended or out of quota? |
| Cannot log in to `/admin` | `AUTH_SECRET` set and unchanged? Admin account created (`npm run admin:create`)? |
| QR codes or vCards point at the wrong address | `NEXT_PUBLIC_SITE_URL` was wrong at build time: fix it and rebuild. |
| Tapping a card lands on "inactive" | Card status (lost or disabled), page status, or `paidUntil` plus grace period has passed. |
| A page change does not show | The public page is cached for up to an hour; saving in `/admin` clears it. If it still does not show, redeploy. |
| `/preview` is open on the live site | `ENABLE_PREVIEW` is set: unset it. |
