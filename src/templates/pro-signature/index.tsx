import Image from "next/image";
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
import { BRAND_NAME } from "@/lib/site";
import { SOCIAL_LABELS, messagingLabel } from "@/lib/socials";
import type { SocialLink } from "@/lib/page-schema";
import { ThemeScope } from "../ThemeScope";
import { findFontPair } from "../font-pairs";
import { displayUrl } from "../shared/model";
import type { TemplateProps } from "../types";
import { FONT_CLASSES } from "./fonts";
import { CardFlip, CopyEmail, HeaderShare, HeaderThemeToggle, SaveButton, ToastProvider } from "./interactive";
import { BLOCK_TITLES, buildBlocks, buildSignatureModel } from "./model";
import { SectionBody } from "./sections";
import "./pro-signature.css";

const ACTION_ICON = {
  call: <PhoneIcon size={21} />,
  email: <MailIcon size={21} />,
  text: <MessageIcon size={21} />,
  directions: <MapPinIcon size={21} />,
  book: <CalendarIcon size={21} />,
} as const;

function LinkList({
  title,
  links,
  label,
  className,
  block,
}: {
  title: string;
  links: SocialLink[];
  label: (link: SocialLink) => string;
  className?: string;
  block: string;
}) {
  return (
    <section className={`ps-section ${className ?? ""}`} data-block={block}>
      <span className="ps-label">{title}</span>
      <div className="ps-list">
        {links.map((s) => (
          <a key={`${s.type}-${s.handle}`} href={s.url} target="_blank" rel="noopener noreferrer">
            <SocialIcon type={s.type} size={42} glyphSize={19} radius={13} />
            <span className="ps-row-text">
              <span className="ps-row-title">{SOCIAL_LABELS[s.type]}</span>
              <span className="ps-row-sub">{label(s)}</span>
            </span>
            <ArrowUpRightIcon size={18} className="ps-row-arrow" />
          </a>
        ))}
      </div>
    </section>
  );
}

/**
 * Professional / contact-first template: portrait flip card with QR on the back and a handwritten sign-off.
 * The Starter design is a fixed stack of blocks. The Standard design draws the same blocks, and the page's optional
 * sections, in the page's order (see `buildBlocks`), with a font pair if one was chosen.
 */
export function ProSignatureTemplate({ data, theme, meta }: TemplateProps) {
  const { profile, contact, style } = data;
  const m = buildSignatureModel(data);
  const design = meta.design ?? "starter";
  const { order, sections } = buildBlocks(data, design);
  const fontPair = design === "standard" && style.fontPair && findFontPair("pro-signature", style.fontPair) ? style.fontPair : undefined;

  const present: Record<string, boolean> = {
    about: Boolean(profile.bio),
    connect: Boolean(m.featured || m.email),
    profiles: m.profiles.length > 0,
    messages: m.messaging.length > 0,
    ...Object.fromEntries(Object.keys(sections).map((k) => [k, true])),
  };
  const firstToken = order.find((t) => present[t]);
  const first = (token: string) => (design === "standard" && firstToken === token ? " ps-first" : "");

  const blocks: Record<string, ReactNode> = {
    about: present.about && (
      <section className={`ps-about${first("about")}`} data-block="about">
        <span className="ps-label">{BLOCK_TITLES.about}</span>
        <p className="ps-quote">“{profile.bio}”</p>
        {m.signature && <span className="ps-signature">{m.signature}</span>}
        <div className="ps-rule" aria-hidden="true" />
      </section>
    ),
    connect: present.connect && (
      <section className={`ps-section ps-connect${first("connect")}`} data-block="connect">
        <span className="ps-label">{BLOCK_TITLES.connect}</span>
        <div className="ps-rows">
          {m.featured && (
            <a href={m.featured.url} className="ps-row-link" target="_blank" rel="noopener noreferrer">
              <SocialIcon type={m.featured.icon} size={40} glyphSize={18} radius={20} />
              <span className="ps-row-text">
                <span className="ps-row-title">{m.featured.label}</span>
                <span className="ps-row-sub">{m.featured.sub}</span>
              </span>
              <ArrowUpRightIcon size={18} className="ps-row-arrow" />
            </a>
          )}
          {m.email && (
            <div className="ps-email-row">
              <MailIcon size={18} />
              <a href={`mailto:${m.email}`}>{m.email}</a>
              <CopyEmail email={m.email} />
            </div>
          )}
        </div>
      </section>
    ),
    profiles: present.profiles && (
      <LinkList title={BLOCK_TITLES.profiles} links={m.profiles} label={(s) => s.handle} className={`ps-section-profiles${first("profiles")}`} block="profiles" />
    ),
    messages: present.messages && (
      <LinkList
        title={BLOCK_TITLES.messages}
        links={m.messaging}
        label={(s) => messagingLabel(s, contact.showPhoneNumbers)}
        className={first("messages").trim()}
        block="messages"
      />
    ),
  };
  for (const [kind, section] of Object.entries(sections)) {
    if (!section) continue;
    blocks[kind] = (
      <section className={`ps-section ps-extra${first(kind)}`} data-block={kind}>
        <span className="ps-label">{BLOCK_TITLES[kind] ?? kind}</span>
        <SectionBody section={section} />
      </section>
    );
  }

  return (
    <ThemeScope
      theme={theme}
      accent={style.accent}
      template="pro-signature"
      className={FONT_CLASSES}
      attrs={{ "data-design": design, "data-font-pair": fontPair }}
    >
      <ToastProvider>
        <main className="ps">
          <div className="ps-wash" aria-hidden="true" />
          {m.initials && (
            <div className="ps-watermark" aria-hidden="true">
              {m.initials}
            </div>
          )}

          <header className="ps-header">
            <HeaderThemeToggle />
            {meta.showBranding ? <span className="ps-brand">[{BRAND_NAME.toUpperCase()}]</span> : <span aria-hidden="true" />}
            <HeaderShare url={meta.pageUrl} title={profile.fullName} />
          </header>

          <CardFlip
            front={
              <>
                <div className="ps-photo">
                  {profile.photoUrl && (
                    <Image
                      src={profile.photoUrl}
                      alt={`Portrait of ${profile.fullName}`}
                      fill
                      sizes="300px"
                      unoptimized
                      priority
                    />
                  )}
                  <span className="ps-nfc-chip">
                    <NfcIcon size={18} />
                  </span>
                </div>
                <div className="ps-card-info">
                  <div className="ps-card-who">
                    <span className="ps-name">{profile.fullName}</span>
                    {profile.title && <span className="ps-title">{profile.title}</span>}
                  </div>
                  <div className="ps-card-foot">
                    {m.cardLabel && <span>{m.cardLabel}</span>}
                    <span className="ps-card-foot-hint">Tap to flip ↻</span>
                  </div>
                </div>
              </>
            }
            back={
              <>
                <span className="ps-back-label">SCAN TO SAVE</span>
                <div className="ps-qr">
                  <Image src={meta.qrHref} alt={`QR code for ${profile.fullName}'s card`} width={176} height={176} unoptimized />
                </div>
                <div className="ps-back-who">
                  <span className="ps-back-name">{profile.fullName}</span>
                  <span className="ps-back-url">{displayUrl(meta.pageUrl)}</span>
                </div>
              </>
            }
          />

          {design === "standard" && m.ticker.length > 0 && (
            <div className="ps-ticker" role="group" aria-label="Highlights">
              <div className="ps-ticker-track">
                {/* The line is shown twice so it can scroll without a gap; the second copy is hidden from screen readers. */}
                {[0, 1].map((copy) =>
                  m.ticker.map((word, i) => (
                    <span key={`${copy}-${i}`} className="ps-ticker-item" aria-hidden={copy === 1 ? "true" : undefined}>
                      {word}
                      <span className="ps-ticker-dot" aria-hidden="true" />
                    </span>
                  )),
                )}
              </div>
            </div>
          )}

          <div className="ps-actions">
            <SaveButton href={meta.vcardHref} />
            {m.actions.length > 0 && (
              <nav className="ps-quick" aria-label="Contact actions" style={{ "--cols": Math.min(m.actions.length, 4) } as CSSProperties}>
                {m.actions.map((a, i) => {
                  const rest = m.actions.length > 4 ? m.actions.length % 4 : 0;
                  // a short last row stretches across the width so no empty cell shows
                  const span = rest && i === m.actions.length - 1 ? 4 - rest + 1 : undefined;
                  return (
                    <a
                      key={a.key}
                      href={a.href}
                      style={span ? { gridColumn: `span ${span}` } : undefined}
                      {...(a.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {ACTION_ICON[a.key]}
                      {a.label}
                    </a>
                  );
                })}
              </nav>
            )}
          </div>

          {order.map((token) => (
            <Fragment key={token}>{blocks[token]}</Fragment>
          ))}

          <Footer tagline="Always one tap away." showBranding={meta.showBranding} className="ps-footer" />
        </main>
      </ToastProvider>
    </ThemeScope>
  );
}
