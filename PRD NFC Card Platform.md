# PRD: NFC Card Platform

Oct 9, 2026 · @Wacko

## Summary

A single Next.js app on one domain that hosts every client's NFC digital card. NFC chips store a short link (`/c/[code]`); the app logs the tap, checks the plan, and renders the client's page from a template plus database content. The owner manages all clients from an admin panel. The domain `tapcard.ph` is a placeholder throughout.

**Business model:** clients pay once for the card and page, with no monthly or yearly fees. Each page is active for a 4-year term from purchase; after that the client can renew for a small fee or upgrade to a new card and design.

**MVP goals (Phase 1)**

- Create a client page from the admin panel in under 10 minutes with no code changes.
- Seven launch templates (4 professional, 1 student, 2 social), each with light and dark themes; pro-classic is built first.
- Standard tier: the same templates with optional sections and extra customization unlocked.
- Tap flow: `/c/[code]` logs the tap and redirects to `/[username]`.
- Save Contact (vCard), QR fallback, share button, branding footer.
- Inactive screen for lapsed plans.

**Non-goals for MVP**

- Client self-service login and dashboards (Phase 3).
- Team organizations, digital menus, product and event pages (Phase 3).
- Online payments and checkout; orders are taken manually via GCash/Maya.
- Subdomains and client custom domains (Phase 2).

## Users and roles

| Role | Who | Access | Phase |
| --- | --- | --- | --- |
| Admin | You (the business owner) | Full admin panel: clients, pages, cards, templates, renewals, analytics | 1 |
| Visitor | Anyone who taps or scans a card | Public client pages, vCard download; no login | 1 |
| Client | A card owner | Read-only view of their page and tap stats | 3 |
| Org admin | Company HR, restaurant owner | Manage their organization's profiles or menu | 3 |

MVP has one admin account. Store roles on the user model from the start so Phase 3 roles need no migration rework.

## Tiers and entitlements

Tiers are enforced in code by an entitlements function, not by separate templates. `getEntitlements(page)` combines the page's tier with its purchased add-ons and returns what the editor may show and what the renderer may display.

| Capability | Starter | Standard | Premium |
| --- | --- | --- | --- |
| Templates | Any Starter template | Any Starter template | Starter templates or a custom component |
| Theme | Light or dark | Light or dark | Any |
| Accent color | Preset palette + school color presets | Any hex | Any |
| Fonts | Template default | Choose from 4 font pairs | Any |
| Section reordering | No | Yes | Yes |
| Optional sections | 0 (add-ons only) | Pick 2 included | Unlimited |
| Featured link | Yes (1) | Yes (1) | Yes |
| Revisions included | 1 | 2 | 3 |
| Small edits included (first year) | 2 | 4 | 6 |
| Branding footer | Shown | Shown | Removable |

**Add-ons** are stored as flags on the page and unlock one capability regardless of tier.

| Add-on key | Unlocks |
| --- | --- |
| `gallery` | Gallery section (up to 10 images) |
| `video` | Video embed section |
| `pdf` | Résumé or brochure download |
| `contact_form` | Swap contacts / inquiry form |
| `booking` | Book action button + booking link |
| `analytics` | Tap and visit stats (client-visible in Phase 3) |
| `custom_domain` | Custom domain mapping (Phase 2) |
| `remove_branding` | Hides the footer credit |

Rule for Standard: "pick 2" means two optional sections are free; each further section requires its add-on flag.

**Service term.** Every tier is a one-time payment covering a 4-year term from purchase (`paidUntil` = purchase date + 4 years).

- **Included edits:** the tier's small edits are included in the first year; later edits are paid per request.
- **Reminder:** the client is contacted about 30 days before the term ends; the admin records when the reminder was sent.
- **Renewal:** a small fee (amount to be decided) extends `paidUntil` by another 4 years. At renewal the client may instead buy a new card and design at a discount.
- **Not renewed:** after a 30-day grace period the page shows `/inactive`. The client can request an export of their page (static HTML) and contact file (`.vcf`).
- **Client-facing wording:** "One-time payment covers your card and page for 4 years, with no monthly or yearly fees. After 4 years, you can keep it active with a small renewal, or upgrade to a new card and design at a discount. We'll remind you before your term ends."

**Every template is available in every tier.** Tiers differ by features (sections, customization, card type, revisions), never by design, so a student on Starter can pick any template.

**Upgrade later by paying the difference.** Changing a page's tier keeps its username, cards and content and only unlocks entitlements. Standard includes a printed card, so an upgrade either adds a reprint charge or keeps the existing plain card; record which on the page.

**Info strip vs stats.** Company, location and work mode are profile fields (Starter). Years of experience, specialty and similar numbers belong to the Standard stats section.

## Templates

A template is a React component that receives a typed `PageData` object and a theme; it never contains client data. All templates live in a registry keyed by `templateKey`, and every template must render correctly with any subset of fields, sections and links present.

Three families: **professional** (contact-first, Save Contact is the main action), **student** (job seekers and fresh grads), and **social** (follow-first, socials at the top, Save Contact secondary). Seven templates ship at launch; the rest are released later as design drops.

| Key | Family | Signature elements | Release |
| --- | --- | --- | --- |
| `pro-classic` | Professional | Holographic card header that flips to QR, Save Contact, icon action row, social grids | Launch (build first) |
| `pro-magazine` | Professional | Full-bleed cover photo, giant name, drop-cap bio, large action rows, sticky Save Contact bar | Launch |
| `pro-signature` | Professional | Flip card with QR, ticker line (availability · company), quoted bio with handwritten signature, list-style socials | Launch |
| `pro-company` | Professional | Company logo slot, arched photo with rotating tap badge, info strip (company, location, work mode), large contact tiles, gradient social tiles | Launch |
| `student-notebook` | Student | Grid-paper background, taped QR polaroid, "Open to" sticky note, program and graduation line, LinkedIn in action row | Launch |
| `social-bento` | Social | Bento tiles, large "Follow me on IG" tile, "Currently" status tile, small icon row for extra socials | Launch |
| `social-scrapbook` | Social | Taped photo, letter-cutout name, ticket-style follow button, sticky-note socials, receipt-style "Also find me on" | Launch |
| `social-retro-os` | Social | Y2K window frames, away-message bio, visitor counter | Drop |
| `social-editorial` | Social | Minimal serif layout, rotating badge on photo | Drop |
| `social-chrome` | Social | Chrome/glass name, star accents, arched photo | Drop |
| `social-gothic-arch` | Social | Gothic arch frame, blackletter name, ornamental dividers | Drop |
| `social-blackletter` | Social | Tattoo-flash ornaments, blackletter name | Drop |

**Themes.** Each template defines colors only through CSS variables (`--bg`, `--surface`, `--text`, `--text-muted`, `--accent`, `--border`). Light and dark are two value sets of the same variables; the page stores its default theme and visitors may toggle it.

**Accent presets.** Starter picks from a fixed palette plus school color presets (two-color pairs such as green/white, blue/gold, maroon/gold). Presets use colors only; never school logos, seals or mascots.

**Standard sections.** Shared section components rendered inside any template when enabled: gallery, portfolio links, services list, résumé download, experience, skills, stats, video, contact form, plus social-family sections interests, orgs and song. Each template supplies a styled variant; build variants for the launch templates first.

**Premium.** A one-off component registered as `custom-[slug]` in the same registry. It uses the same `PageData`, routes, vCard and tap logging. Designs may be explored in a design tool first, then implemented as the component.

**Template rules**

- Hide any section, grid, tile or button with no data; never show empty icons.
- Grids reflow cleanly for 1, 2 or 3+ items.
- Muted text meets WCAG AA contrast (4.5:1) in both themes.
- Large-name designs must fit names up to 30 characters by wrapping or scaling; the scrapbook letter cutouts are generated per character.
- `showPhoneNumbers` controls every place a number appears (call tile, WhatsApp, Viber); it defaults to off for student and social families. When off, messaging tiles say "Chat".
- Directions button and office tile appear only when `contact.officeAddress` is set.
- Flip cards: the QR face must not render mirrored (`backface-visibility: hidden` on both faces, back face rotated 180°); the QR must scan.
- The visitor counter shows the real tap count for the page, or is hidden; never a fake number.
- No design-tool controls (gear or settings icons) on public pages. Footer shows the template tagline plus "Digital card by \[brand\]" linking to `/`.

## Design reference files

Template designs come from Claude Design as static HTML mockups. They are visual references only: each one is converted once into a React template component, and the app never serves the HTML directly.

**Status: no reference files are in the repo yet.** The designs exist in Claude Design and will be exported one at a time as `index.html` files. Until a template's file arrives, do not invent its design: build the app against a plain `placeholder` template that uses the shared components and theme variables, and convert each real template only once its file is added. Exported files may be saved either as `design-reference/[name].html` or as a folder `design-reference/[name]/index.html` (keeping any exported assets beside it).

Store them in `design-reference/` at the repo root, named `[tier]-package-[family]-template-[n].html`:

| Reference file | Converts to `templateKey` |
| --- | --- |
| `starter-package-professional-template-1.html` | `pro-classic` |
| `starter-package-professional-template-2.html` | `pro-magazine` |
| `starter-package-professional-template-3.html` | `pro-signature` |
| `starter-package-professional-template-4.html` | `pro-company` |
| `starter-package-student-template-1.html` | `student-notebook` |
| `starter-package-social-template-1.html` | `social-bento` |
| `starter-package-social-template-2.html` | `social-scrapbook` |
| `starter-package-social-template-3.html` to `-7.html` | `social-retro-os`, `social-editorial`, `social-chrome`, `social-gothic-arch`, `social-blackletter` (drops) |
| `standard-package-sections-[templateKey].html` | Styled section variants for that template |
| `premium-package-[username].html` | `custom-[username]` |

Each reference file shows both light and dark themes and uses realistic placeholder data. New designs continue the numbering and get a row here and in the Templates table before they are built.

**Conversion rules (for Claude Code)**

1. Match the reference visually at 375 px width in both light and dark themes.
2. Replace every placeholder ("Your Full Name", sample handles, sample numbers) with fields from `PageData`.
3. Move all hardcoded colors into the theme CSS variables; no hex values inside template files.
4. Reuse shared components (ActionRow, SaveContact, SocialGrid, FeaturedLink, Footer) instead of copying their markup.
5. Rewrite inline scripts (QR toggle, copy, share) as small client components.
6. Hide every section, grid or button whose data is empty.
7. Leave the HTML file unchanged so it stays the reference to compare against.

Example prompt: "Convert `design-reference/starter-package-professional-template-1.html` into the `pro-classic` template, following the PRD conversion rules."

## Page content model

Page content is one typed JSON object validated with Zod on write and on read. Core fields are fixed keys; links and sections are arrays so templates stay flexible.

```ts
type PageData = {
  profile: {
    fullName: string;
    displayName?: string;    // nickname shown by social templates
    title?: string;          // job title
    company?: string;
    logoUrl?: string;        // company logo (pro-company)
    location?: string;       // e.g. "Cavite, PH"
    workMode?: "remote" | "onsite" | "hybrid";
    photoUrl?: string;
    bio?: string;            // one line for Starter, longer for Standard
    availability?: string;   // badge or ticker, e.g. "Replies within a day"
    status?: string;         // social "Currently" tile
    signature?: string;      // pro-signature handwritten name
    student?: {
      school?: string;
      program?: string;      // e.g. "BSCS"
      year?: string;         // e.g. "3rd year"
      graduating?: string;   // e.g. "2027"
      openTo?: string;       // e.g. "Internships & entry-level roles"
    };
  };
  contact: {
    phone?: string;          // E.164, e.g. +639171234567
    email?: string;
    sms?: boolean;           // show Text button
    officeAddress?: string;  // enables Directions and office tile
    showPhoneNumbers: boolean;
  };
  featuredLink?: { label: string; url: string; icon?: SocialType }; // social family: "Follow me" hero
  socials: SocialLink[];     // ordered; template groups them
  sections: Section[];       // Standard/Premium/add-ons only
  style: {
    theme: "light" | "dark"; // default; visitors can toggle
    accent: string;          // hex or preset id
    fontPair?: string;       // Standard+
    bannerUrl?: string;      // Premium custom designs only
  };
};

type SocialType =
  | "linkedin" | "facebook" | "instagram" | "tiktok" | "youtube"
  | "github" | "behance" | "x" | "spotify" | "pinterest" | "website"
  | "messenger" | "whatsapp" | "viber" | "telegram" | "discord";

type SocialLink = { type: SocialType; handle: string; url: string; note?: string }; // note: "say hi!"

type Section =
  | { kind: "gallery"; images: { url: string; alt: string }[] }
  | { kind: "portfolio"; items: { title: string; desc?: string; url: string; thumbUrl?: string }[] }
  | { kind: "services"; items: { name: string; price?: string }[] }
  | { kind: "resume"; fileUrl: string; label?: string }
  | { kind: "experience"; items: { role: string; org: string; years: string }[] }
  | { kind: "skills"; items: string[] }
  | { kind: "stats"; items: { label: string; value: string }[] }
  | { kind: "video"; url: string }
  | { kind: "contactForm" }
  | { kind: "booking"; url: string }
  | { kind: "interests"; items: string[] }
  | { kind: "orgs"; items: { name: string; role?: string }[] }
  | { kind: "song"; spotifyUrl: string };
```

The social grouping is fixed in code: LinkedIn, Facebook, Instagram, TikTok, YouTube, GitHub, Behance, X, Spotify, Pinterest and website go under "Profiles to view"; Messenger, WhatsApp, Viber, Telegram and Discord go under "Ways to message". Social templates may lay these out differently (hero tile, bento, receipt list) but use the same data. URLs are generated from handles where possible (`m.me/[handle]`, `wa.me/[number]`, `viber://chat?number=`).

## Routes and URL structure

The chip always stores `/c/[code]`, never the username, so pages can be renamed, reassigned or deactivated without rewriting cards.

| Route | Purpose | Auth | Phase |
| --- | --- | --- | --- |
| `/` | Business homepage: offer, tiers, sample cards, contact | Public | 1 |
| `/c/[code]` | Tap entry: log tap, check card and plan status, 302 redirect | Public | 1 |
| `/[username]` | Render client page | Public | 1 |
| `/[username]/vcard` | Generate and download `.vcf` | Public | 1 |
| `/[username]/qr` | QR image (PNG/SVG) of the page or card URL | Public | 1 |
| `/inactive` | Shown when a plan lapsed or card is disabled | Public | 1 |
| `/admin/login` | Admin sign-in | Public | 1 |
| `/admin/*` | Admin panel | Admin | 1 |
| `/api/contact/[username]` | Contact form submissions | Public, rate-limited | 2 |
| Host-based (`mariasantos.com`) | Middleware maps custom domain to a page | Public | 2 |
| `/dashboard/*` | Client and org dashboards | Client | 3 |

Reserve usernames that collide with app routes (`admin`, `c`, `api`, `dashboard`, `inactive`, `login`, `about`, `pricing`). Usernames are lowercase `a-z0-9-`, 3–30 characters.

## Key flows

Every tap enters through `/c/[code]`; the app checks the card and plan, then either renders the page or shows the inactive screen.

&#91;embedded content: Tap flow · one status check, two outcomes\]

"Plan paid" means `paidUntil` plus the grace period has not passed and the page status is ACTIVE. Tap logging runs without delaying the redirect, and also sets `lastTapAt` on the card and its page.

**Create a client (admin)**

1. Create the client record (name, contact info).
2. Create the page: username, tier, template, theme, accent.
3. Fill profile, contact, socials and any entitled sections; check the live preview.
4. Send the preview link for revisions; set status to ACTIVE and `paidUntil` to four years out.
5. Generate a card code and write `https://tapcard.ph/c/[code]` to the chip, then lock it.
6. Test the tap on an iPhone and an Android, and test the QR.

**Lost card:** mark the old card LOST (its code now shows `/inactive`), generate a new code, and write it to a replacement card. The page itself is untouched.

**Renewal:** about 30 days before `paidUntil`, the dashboard lists the page and you contact the client. Renewing extends `paidUntil` by 4 years and reactivates a lapsed page instantly; no card changes are needed. If the client does not renew, offer the page export.

## Data model

Starting Prisma schema. `Organization` and `CustomDomain` exist from day one so Phase 2–3 features add rows, not migrations of core tables.

```prisma
enum Role { ADMIN CLIENT ORG_ADMIN }
enum Tier { STARTER STANDARD PREMIUM }
enum PageStatus { DRAFT ACTIVE INACTIVE }
enum CardStatus { ACTIVE DISABLED LOST }

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  role         Role     @default(ADMIN)
  client       Client?  @relation(fields: [clientId], references: [id])
  clientId     String?  @unique
  createdAt    DateTime @default(now())
}

model Organization {
  id        String   @id @default(cuid())
  name      String
  clients   Client[]
  createdAt DateTime @default(now())
}

model Client {
  id             String        @id @default(cuid())
  name           String
  contactEmail   String?
  contactPhone   String?
  notes          String?
  organization   Organization? @relation(fields: [organizationId], references: [id])
  organizationId String?
  pages          Page[]
  user           User?
  createdAt      DateTime      @default(now())
}

model Page {
  id           String         @id @default(cuid())
  username     String         @unique
  client       Client         @relation(fields: [clientId], references: [id])
  clientId     String
  tier         Tier           @default(STARTER)
  templateKey  String         // e.g. "pro-classic", "custom-maria"
  data         Json           // PageData, validated with Zod
  addOns       String[]       // e.g. ["gallery", "pdf"]
  status       PageStatus     @default(DRAFT)
  paidUntil    DateTime?      // end of the 4-year term; renewal extends it
  editsUsed    Int            @default(0) // included edits used
  reminderSentAt DateTime?    // renewal reminder sent
  lastTapAt      DateTime?    // last tap on any of its cards
  cards        Card[]
  taps         Tap[]
  domains      CustomDomain[]
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
}

model Card {
  id        String     @id @default(cuid())
  code      String     @unique // 6-8 chars, written to the chip
  page      Page       @relation(fields: [pageId], references: [id])
  pageId    String
  label     String?    // "Main PVC", "Spare"
  lastTapAt DateTime?  // set on every logged tap
  status    CardStatus @default(ACTIVE)
  taps      Tap[]
  createdAt DateTime   @default(now())
}

model Tap {
  id        String   @id @default(cuid())
  card      Card?    @relation(fields: [cardId], references: [id])
  cardId    String?  // null for direct page visits
  page      Page     @relation(fields: [pageId], references: [id])
  pageId    String
  source    String   // "nfc" | "qr" | "direct"
  userAgent String?
  country   String?
  createdAt DateTime @default(now())

  @@index([pageId, createdAt])
}

model CustomDomain {
  id       String  @id @default(cuid())
  hostname String  @unique
  page     Page    @relation(fields: [pageId], references: [id])
  pageId   String
  verified Boolean @default(false)
}
```

Store no IP addresses in `Tap`; device type and country are enough for analytics and avoid holding personal data about visitors.

## Admin panel

The admin panel is where all client work happens; a typical Starter client should take one form and one save.

| Screen | Requirements | Phase |
| --- | --- | --- |
| Dashboard | Counts of active pages, taps this week, pages by usage status (active, quiet, dormant, never used), renewals due in the next 30 days | 1 |
| Clients list | Search by name or username; tier, status and `paidUntil` columns; filter by tier and status | 1 |
| New / edit page | Pick tier, then template and theme; form fields generated from `getEntitlements` so locked options are hidden; image upload with crop; social link list with add, remove and reorder; section picker respecting the tier's limit | 1 |
| Live preview | Side-by-side phone-width preview that updates as the form changes, with a light/dark switch | 1 |
| Cards | Generate a card code, show the full chip URL with a copy button, show the QR, mark a card lost or disabled, add a spare card | 1 |
| Renewals | Set or extend `paidUntil`; increment or reset `editsUsed`; mark a page inactive | 1 |
| Analytics | Taps per page over time, NFC vs QR vs direct split | 2 |
| Organizations | Group clients, shared brand settings | 3 |

**Renewals screen** lists pages whose term ends within 30 days, lets you mark the reminder as sent, renew (extend `paidUntil` by 4 years), and export a page as static HTML plus `.vcf` for clients who do not renew (export is Phase 2).

**Tier upgrades** happen on the edit page: change the tier, record the amount paid (the price difference) and whether a reprint is included. Username, cards and content stay the same.

Auth for MVP: a single admin account via Auth.js credentials with a bcrypt-hashed password, session cookie, and middleware protecting `/admin/*`. Add login rate limiting.

## Usage monitoring

Every card use passes through `/c/[code]`, so the app already sees it. Usage status is derived from the last tap rather than set by hand, and it is separate from `PageStatus` (is the page live) and `CardStatus` (is the card valid).

**What a tap does.** After the status checks, `/c/[code]` records a `Tap` and sets `lastTapAt` on the card and its page, without delaying the redirect. A repeat from the same device within 10 minutes adds no new `Tap` row. Bots and link-preview fetchers (identified by user agent) are not logged.

**What counts as use.** NFC taps (the chip stores `/c/[code]`, source defaults to NFC) and QR scans (the QR encodes `/c/[code]?src=qr`). Direct visits to `/[username]` are not logged because those pages are cached, so they do not change usage status.

| Usage status | Rule | Typical meaning |
| --- | --- | --- |
| Active | Last tap within 30 days | Card is in regular use |
| Quiet | 31–90 days since last tap | Use is slowing down |
| Dormant | More than 90 days since last tap | Forgotten, lost, or no longer given out |
| Never used | No tap, page live for more than 14 days | Card not handed out yet, or the chip is not working |
| New | No tap, page live for 14 days or less | Too early to tell |

Thresholds live as constants in one file (`lib/usage.ts`) so they are easy to change.

**Admin views**

- **Clients list:** usage badge and a "last tapped" column; filter and sort by usage status.
- **Dashboard:** counts of pages per usage status.
- **Page detail:** total taps, last tapped, and last tapped per card (a spare card can show as unused while the main card is active); charts and the NFC/QR split arrive with Analytics in Phase 2.
- **Check-in list:** the Dormant and Never used filter doubles as your follow-up list, for example asking a never-used client whether the chip works, or offering a new card to a dormant one.
- **Reset usage:** a button on each card that deletes its taps and clears `lastTapAt`, so the test taps from writing and checking a new chip do not count as the client's first use.

**Limits**

- A tap shows the card was used, not who used it; most taps come from the client's contacts, not the owner.
- Usage status never changes `PageStatus` or `CardStatus`. A dormant card stays active for the full 4-year term the client paid for.
- No IP addresses or personal visitor data are stored; device type and country are enough.

## Public page requirements

The public page must open fast on a mid-range Android over mobile data, because a slow first tap undercuts the whole product.

| Area | Requirement |
| --- | --- |
| Performance | Server-rendered; Largest Contentful Paint under 2.5 s on 4G; images via `next/image` at photo-appropriate sizes; no client JS beyond the QR toggle, copy and share buttons |
| Caching | Pages cached with on-demand revalidation when the admin saves; `/c/[code]` never cached |
| Save Contact | vCard 3.0 with name, title, company, phone, email, URL and embedded photo (base64, under 100 KB); works on iOS and Android |
| QR toggle | Card/QR switch on the header renders the card URL with a source flag (`/c/[code]?src=qr`) as a QR code, so scans count as card use |
| Share | Web Share API with copy-link fallback |
| Actions | Call (`tel:`), Email (`mailto:`), Text (`sms:`); Book only with the `booking` add-on |
| Branding footer | "Made by \[brand\]" linking to `/`, small and muted; hidden with `remove_branding` or on Premium |
| Accessibility | WCAG AA contrast in both themes; tap targets at least 44 px; alt text on images; works at 320 px width |
| SEO and privacy | `noindex` by default (client opt-in to indexing); Open Graph tags with name and photo for link previews |
| Inactive | Lapsed `paidUntil` plus 30-day grace, or disabled card, shows `/inactive` with your branding and contact |

## Tech stack and structure

One Next.js App Router project in TypeScript, deployed to Hostinger's managed Node.js web apps hosting, with Postgres on Neon's free tier.

| Concern | Choice |
| --- | --- |
| Framework | Next.js (App Router), TypeScript strict mode |
| Styling | Tailwind CSS with CSS variables for theme tokens |
| Database | PostgreSQL + Prisma |
| Validation | Zod schemas shared by admin forms and the renderer |
| Auth | Auth.js credentials provider (admin only in MVP) |
| Images and files | Cloudinary or Cloudflare R2; never stored in the database |
| QR | `qrcode` npm package, server-side |
| vCard | Hand-written generator in `lib/vcard.ts` |
| Hosting | Hostinger managed Node.js web apps hosting (Business web hosting plan or higher, prepaid for a long term); custom domain `tapcard.ph` (placeholder) |
| Testing | Vitest for lib functions, Playwright for the tap and vCard flows |

```text
src/
  app/
    (marketing)/page.tsx          # homepage
    c/[code]/route.ts             # tap entry: log + redirect
    [username]/page.tsx           # public client page
    [username]/vcard/route.ts
    [username]/qr/route.ts
    inactive/page.tsx
    admin/                        # protected admin panel
  templates/
    registry.ts                   # templateKey -> component
    pro-classic/
    pro-centered/
    social-pop/
    custom/                       # Premium one-offs
  sections/                       # gallery, portfolio, services, resume, ...
  components/                     # shared UI: SocialGrid, ActionRow, SaveContact
  lib/
    entitlements.ts               # tier + add-ons -> capabilities
    page-schema.ts                # Zod PageData
    socials.ts                    # handle -> URL, grouping
    vcard.ts
    db.ts
  styles/themes.css               # light/dark variable sets, accent presets
prisma/schema.prisma
```

**Non-functional requirements**

- Every client page renders from the same code path; no per-client files except Premium components.
- Secrets only in environment variables; `.env.example` lists them.
- Daily database backups (provider-managed).
- Tap logging must never block the redirect; write the tap asynchronously or fire-and-forget.
- Card codes are random, non-sequential, at least 6 characters from an unambiguous alphabet (no 0/O, 1/l).

**Hosting (Hostinger managed Node.js web apps)**

Production runs on Hostinger's managed Node.js hosting: a flat monthly price with unlimited bandwidth and requests and no credit meter. Plans still have CPU and memory limits, so the app stays light. Prepay a long term (up to 48 months) so hosting is covered for the 4-year service term, and check the renewal price at checkout.

- **Deploys:** connect the GitHub repo; Hostinger builds and runs it (`next build`, `next start`). Production branch is `release`; daily work happens on `main` and feature branches. There is no deploy quota, but keep `release` stable because it is live for clients.
- **Database:** Postgres stays on Neon (free tier) with its pooled connection string for Prisma. Do not rely on a database bundled with the hosting plan.
- **Images:** all photos and files are served from Cloudinary or R2, resized and compressed (around 600 px wide, WebP), never from the app.
- **Caching:** client pages are cached and revalidated on admin save so most visits use little CPU. Middleware matches only `/admin` routes.
- **Fonts:** at most two families, only the weights in use.
- **External links** go straight to their destination; no click tracking through the server.
- **Abuse protection:** Hostinger's CDN, firewall and DDoS protection are included. Add a simple in-app rate limit of about 30 requests per minute per IP on `/c/*` and `/[username]/vcard` (the app runs as one always-on Node process, so an in-memory limiter is enough); add `robots.txt` plus `noindex` on client pages.
- **Tap logging:** repeat taps from the same device within 10 minutes count once, and logging never delays the redirect.
- **Monitoring:** check the hosting panel's resource usage weekly during the first month; move to a larger plan if CPU or memory limits are hit.
- **Before buying:** confirm the plan includes Node.js web apps, its resource limits, the checkout price and the renewal price.
- **Portability:** keep host-specific settings out of app code so the app can move to another host by redeploying and updating DNS.

## Build milestones

Build in this order and give Claude Code one milestone at a time; each ends with something you can test on a real phone.

Template HTML files are delivered later, so M1–M3 are built with the `placeholder` template. Converting `pro-classic` (in M2) and the other templates (in M4) waits until their reference files are in `design-reference/`; skip those items until then and continue with the rest.

**M1 — Foundation**

- [ ] Scaffold Next.js + TypeScript + Tailwind + Prisma; add `.env.example`
- [ ] Write the Prisma schema and first migration
- [ ] Write `page-schema.ts` (Zod `PageData`) and `entitlements.ts` with unit tests
- [ ] Seed one client page with `pro-classic` sample data

**M2 — Public page and tap flow**

- [ ] Build `pro-classic` from the existing design, using theme variables for light and dark
- [ ] Shared components: ActionRow, SaveContact, SocialGrid (profiles / messaging), FeaturedLink, Footer
- [ ] `/[username]` page, `/[username]/vcard`, `/[username]/qr`
- [ ] `/c/[code]` route with tap logging, status checks and redirect; `/inactive` page
- [ ] Deploy to Hostinger from the \`release\` branch, connect the domain, write a real NFC tag and test on iPhone and Android

**M3 — Admin panel**

- [ ] Admin login and route protection
- [ ] Clients list, new/edit page form driven by entitlements, live preview
- [ ] Image upload, social link editor, card code generation with copy and QR
- [ ] Renewals screen and edit counter; usage badge, last-tapped column and usage filter on the clients list

**M4 — Templates and Standard**

- [ ] Remaining launch templates in both themes: `pro-magazine`, `pro-signature`, `pro-company`, `student-notebook`, `social-bento`, `social-scrapbook`
- [ ] Accent palette and school color presets
- [ ] Standard sections with styled variants for each launch template
- [ ] Font pairs and section reordering for Standard
- [ ] Tier upgrade on the edit page

**M5 — Launch polish**

- [ ] Marketing homepage with tiers and sample cards
- [ ] Lighthouse mobile check (performance and accessibility at least 90)
- [ ] Playwright tests for tap → page → vCard

**Later phases**

- [ ] Phase 2: analytics screen, contact form with rate limiting, custom domains via middleware, remove-branding add-on
- [ ] Phase 3: client and org dashboards, team cards, digital menus, product and event pages

**Using this PRD with Claude Code:** save it as `docs/PRD.md` in the repo and reference it from `CLAUDE.md`, along with your conventions (strict TypeScript, Zod at boundaries, no client data in templates). Ask for one milestone per session and review each before moving on.

## Open questions

- [ ] Final brand name and domain (replaces `tapcard.ph`)
- [ ] Renewal fee after the 4-year term (draft: ₱300–500)
- [ ] Final prices (draft: Starter ₱1,200 professional, ₱1,000 student with school ID)
- [ ] Image storage provider: Cloudinary or Cloudflare R2
- [ ] Reprint policy when upgrading Starter to Standard
- [ ] Grace period length before a lapsed page goes inactive (draft: 30 days)
- [ ] Order of the five drop templates after launch
