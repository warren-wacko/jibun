import Image from "next/image";
import { buildVCard } from "@/lib/vcard";
import { Fragment, type CSSProperties, type ReactNode } from "react";
import {
  ArrowUpRightIcon,
  CalendarIcon,
  MailIcon,
  MapPinIcon,
  MessageIcon,
  NfcIcon,
  PhoneIcon,
} from "@/components/icons";
import { Footer } from "@/components/Footer";
import { SocialIcon } from "@/components/SocialIcon";
import { SOCIAL_LABELS, messagingLabel } from "@/lib/socials";
import { BRAND_NAME } from "@/lib/site";
import type { SocialLink } from "@/lib/page-schema";
import { ThemeScope } from "../ThemeScope";
import { findFontPair } from "../font-pairs";
import type { TemplateProps } from "../types";
import { FONT_CLASSES } from "./fonts";
import { CardFlip, CopyEmail, HeaderShare, HeaderThemeToggle, SaveButton, ToastProvider } from "./interactive";
import { BLOCK_TITLES, buildBlocks, buildModel, displayUrl } from "./model";
import { SectionBody } from "./sections";
import "./pro-classic.css";

const ACTION_ICON = {
  call: <PhoneIcon />,
  email: <MailIcon />,
  text: <MessageIcon />,
  directions: <MapPinIcon />,
  book: <CalendarIcon />,
} as const;

function Section({ title, className, block, children }: { title: string; className?: string; block: string; children: ReactNode }) {
  return (
    <section className={`pc-section ${className ?? ""}`} data-block={block}>
      <span className="pc-label">{title}</span>
      {children}
    </section>
  );
}

function TileGrid({ links, label }: { links: SocialLink[]; label: (link: SocialLink) => string }) {
  // 1 item fills the row, 2 split it, 3+ make rows of three.
  const cols = Math.min(links.length, 3);
  return (
    <div className="pc-grid" style={{ "--cols": cols } as CSSProperties}>
      {links.map((s) => (
        <a key={`${s.type}-${s.handle}`} href={s.url} className="pc-tile" target="_blank" rel="noopener noreferrer">
          <SocialIcon type={s.type} />
          <span className="pc-tile-text">
            <span className="pc-tile-name">{SOCIAL_LABELS[s.type]}</span>
            <span className="pc-tile-handle">{label(s)}</span>
          </span>
        </a>
      ))}
    </div>
  );
}

/**
 * Professional / contact-first template with a flip card (holographic shine, QR on the back).
 * The Starter design is a fixed stack of blocks. The Standard design draws the same blocks, and the page's optional
 * sections, in the page's order (see `buildBlocks`), with a font pair if one was chosen.
 */
export function ProClassicTemplate({ data, theme, meta }: TemplateProps) {
  const { profile, contact, style } = data;
  const m = buildModel(data);
  const vcard = buildVCard(data, { pageUrl: meta.pageUrl });
  const design = meta.design ?? "starter";
  const { order, sections } = buildBlocks(data, design);
  const fontPair = design === "standard" && style.fontPair && findFontPair("pro-classic", style.fontPair) ? style.fontPair : undefined;

  const blocks: Record<string, ReactNode> = {
    about: profile.bio ? (
      <section className="pc-section pc-about" data-block="about">
        <span className="pc-label">{BLOCK_TITLES.about}</span>
        <p>{profile.bio}</p>
      </section>
    ) : null,
    connect:
      m.featured || m.email ? (
        <Section title={BLOCK_TITLES.connect} className="pc-connect" block="connect">
          <div className="pc-rows">
          {m.featured && (
            <a href={m.featured.url} className="pc-row pc-row-link" target="_blank" rel="noopener noreferrer">
              <SocialIcon type={m.featured.icon} size={38} glyphSize={18} />
              <span className="pc-row-text">
                <span className="pc-row-title">{m.featured.label}</span>
                <span className="pc-row-sub">{m.featured.sub}</span>
              </span>
              <ArrowUpRightIcon size={18} className="pc-row-arrow" />
            </a>
          )}
          {m.email && (
            <div className="pc-row pc-row-email">
              <MailIcon size={18} />
              <a href={`mailto:${m.email}`}>{m.email}</a>
              <CopyEmail email={m.email} />
            </div>
          )}
          </div>
        </Section>
      ) : null,
    profiles:
      m.profiles.length > 0 ? (
        <Section title={BLOCK_TITLES.profiles} block="profiles">
          <TileGrid links={m.profiles} label={(s) => s.handle} />
        </Section>
      ) : null,
    messages:
      m.messaging.length > 0 ? (
        <Section title={BLOCK_TITLES.messages} block="messages">
          <TileGrid links={m.messaging} label={(s) => messagingLabel(s, contact.showPhoneNumbers)} />
        </Section>
      ) : null,
  };
  for (const [kind, section] of Object.entries(sections)) {
    if (!section) continue;
    blocks[kind] = (
      <Section title={BLOCK_TITLES[kind] ?? kind} block={kind}>
        <SectionBody section={section} />
      </Section>
    );
  }

  return (
    <ThemeScope
      theme={theme}
      accent={style.accent}
      template="pro-classic"
      className={FONT_CLASSES}
      attrs={{ "data-design": design, "data-font-pair": fontPair }}
    >
      <ToastProvider>
        <main className="pc">
          <div className="pc-glow" aria-hidden="true" />

          <header className="pc-header">
            {meta.showBranding ? (
              <span className="pc-label">[{BRAND_NAME.toUpperCase()}]</span>
            ) : (
              <span aria-hidden="true" />
            )}
            <div className="pc-header-actions">
              <HeaderThemeToggle />
              <HeaderShare url={meta.pageUrl} title={profile.fullName} />
            </div>
          </header>

          <CardFlip
            front={
              <>
                <div className="pc-holo" aria-hidden="true" />
                <div className="pc-glare" aria-hidden="true" />
                <div className="pc-face-top">
                  {m.cardLabel && <span className="pc-face-label">{m.cardLabel}</span>}
                  <NfcIcon size={22} className="pc-nfc" />
                </div>
                <div className="pc-face-bottom">
                  <div className="pc-name-block">
                    <span className="pc-name">{profile.fullName}</span>
                    {profile.title && <span className="pc-title">{profile.title}</span>}
                  </div>
                  {profile.photoUrl && (
                    <div className="pc-photo">
                      <Image
                        src={profile.photoUrl}
                        alt={`Portrait of ${profile.fullName}`}
                        width={160}
                        height={160}
                        unoptimized
                        priority
                      />
                    </div>
                  )}
                </div>
              </>
            }
            back={
              <>
                <div className="pc-glare" aria-hidden="true" />
                <div className="pc-qr">
                  <Image src={meta.qrHref} alt={`QR code for ${profile.fullName}'s card`} width={132} height={132} unoptimized />
                </div>
                <div className="pc-back-text">
                  <span className="pc-back-title">Scan to save me to your phone</span>
                  <span className="pc-back-url">{displayUrl(meta.pageUrl)}</span>
                </div>
              </>
            }
          />

          <div className="pc-actions pc-anim-rise">
            <SaveButton href={meta.vcardHref} vcard={vcard} />
            {m.actions.length > 0 && (
              <nav
                className="pc-quick"
                aria-label="Contact actions"
                style={{ "--cols": Math.min(m.actions.length, 4) } as CSSProperties}
              >
                {m.actions.map((a) => (
                  <a
                    key={a.key}
                    href={a.href}
                    {...(a.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    <span className="pc-quick-ring">{ACTION_ICON[a.key]}</span>
                    {a.label}
                  </a>
                ))}
              </nav>
            )}
          </div>

          {order.map((token) => (
            <Fragment key={token}>{blocks[token]}</Fragment>
          ))}

          <Footer tagline="Always one tap away." showBranding={meta.showBranding} className="pc-footer" />
        </main>
      </ToastProvider>
    </ThemeScope>
  );
}
