# Launch checklist

What is left before Jibun is live. The code for Phases 0 to 5 is built and tested; what remains needs you, an account, or a decision. Tick items as they are done. Details for deploying are in `docs/PRODUCTION.md`.

## 1. Accounts to create (you)

- [ ] **Cloudinary** account. Give Claude: cloud name, API key, API secret.
- [ ] **Hostinger** Business (or higher) plan with Node.js web apps hosting, prepaid for a long term.
- [ ] **Domain** chosen and bought (replaces the `tapcard.ph` placeholder).
- [ ] **Neon** production database. Use a pooled connection for `DATABASE_URL` and a direct one for `DIRECT_URL`. Check the free plan's restore window.
- [ ] A free **uptime check** (for example UptimeRobot) on `/inactive`.

## 2. Code work that waits on those accounts (Claude)

- [ ] Photo upload with crop in the editor, using Cloudinary (replaces pasting a link). Check the photo still reaches the vCard.
- [ ] First deploy of the `release` branch to Hostinger.

## 3. Fill in your own details (you)

Set these as environment variables on Hostinger. They are read at build time, so set them before the build and rebuild if they change. The homepage and the legal pages show dummy values until they are set.

- [ ] `NEXT_PUBLIC_SITE_URL` (the real address, no trailing slash)
- [ ] `NEXT_PUBLIC_CONTACT_MESSENGER` (yours: `https://m.me/61595658624677`, or a nicer one after you set a Page username)
- [ ] `NEXT_PUBLIC_CONTACT_INSTAGRAM`
- [ ] `NEXT_PUBLIC_CONTACT_EMAIL`
- [ ] `NEXT_PUBLIC_CONTACT_PHONE`
- [ ] `NEXT_PUBLIC_CONTACT_PAYMENT_METHODS` (for example "GCash or Maya")
- [ ] `AUTH_SECRET` (random, 32+ characters)
- [ ] `DATABASE_URL`, `DIRECT_URL`
- [ ] `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- [ ] `ENABLE_PREVIEW` left **unset** in production

## 4. Content and wording to check (you)

- [ ] Privacy and Terms pages (`src/lib/legal.ts`) read by someone who can check them. Add refunds and a price list if you want them covered.
- [ ] Homepage wording and the FAQ answers still say what you want.
- [ ] The six sample screenshots on the homepage (`public/marketing/`) still match the templates.
- [ ] Backup plan decided: how often, and where the copies are kept.

## 5. Go-live steps (together)

- [ ] Run `npx prisma migrate deploy` against the production database. Do not run the seed.
- [ ] Create the real admin account: `npm run admin:create` with `DIRECT_URL` pointing at production.
- [ ] Open `/` and check the contact buttons are yours, not the dummy ones. Open `/privacy`, `/terms` and `/inactive`.
- [ ] Sign in to `/admin`, create a real client, page and card.
- [ ] Write a real NFC tag and test on an **iPhone** and an **Android**: tap, QR scan, Save Contact.
- [ ] Run a Lighthouse check on the live homepage and one card page.
- [ ] First week: look at the Hostinger resource usage; check Renewals weekly.

## 6. Decisions that do not block launch

- [ ] Renewal fee (draft ₱300 to 500)
- [ ] Final prices (kept off the site; people message you)
- [ ] Order of the five later template drops

## 7. Optional polish

- [ ] A share image for links pasted in Messenger (the logo master is in `public/brand/jibun-logo.png`; the favicon is done)
- [ ] Wider network dropdown in the editor at very narrow widths
- [ ] Smaller shared CSS bundle (Lighthouse is already about 90)
- [ ] A health-check route, if you want a dedicated uptime endpoint
