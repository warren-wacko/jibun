import Image from "next/image";
import { Fragment, type CSSProperties, type ReactNode } from "react";
import {
  ArrowUpRightIcon,
  BadgeNfcIcon,
  BuildingIcon,
  MailIcon,
  MapPinIcon,
  MessageIcon,
  PhoneIcon,
} from "@/components/icons";
import { Footer } from "@/components/Footer";
import { BrandGlyph } from "@/components/SocialIcon";
import { SOCIAL_LABELS, messagingLabel } from "@/lib/socials";
import type { SocialLink } from "@/lib/page-schema";
import { ThemeScope } from "../ThemeScope";
import { findFontPair } from "../font-pairs";
import { displayUrl } from "../shared/model";
import type { TemplateProps } from "../types";
import { FONT_CLASSES } from "./fonts";
import { CopyButton, QrSheet, SaveButton, ToastProvider, TopShare, TopThemeToggle } from "./interactive";
import { BADGE_RING_TEXT, buildCompanyModel } from "./model";
import { BARE_KINDS, SectionBody } from "./sections";
import "./pro-company.css";

const RING_STEP = 360 / BADGE_RING_TEXT.length;

function SectionHead({ num, title }: { num: string; title: string }) {
  return (
    <div className="pco-sec-head">
      <span className="pco-sec-num">{num}</span>
      <span className="pco-sec-title">{title}</span>
      <span className="pco-sec-rule" aria-hidden="true" />
    </div>
  );
}

function TileLink({ s, label }: { s: SocialLink; label: string }) {
  return (
    <a href={s.url} className="pco-net pco-net-tile" data-net={s.type} target="_blank" rel="noopener noreferrer">
      <BrandGlyph type={s.type} size={86} className="pco-net-ghost" />
      <span className="pco-net-glyph">
        <BrandGlyph type={s.type} size={26} />
      </span>
      <span className="pco-net-text">
        <strong>{SOCIAL_LABELS[s.type]}</strong>
        <span>{label}</span>
      </span>
    </a>
  );
}

function RowLink({ s, label }: { s: SocialLink; label: string }) {
  return (
    <a href={s.url} className="pco-net pco-net-row" data-net={s.type} target="_blank" rel="noopener noreferrer">
      <BrandGlyph type={s.type} size={104} className="pco-net-ghost" />
      <span className="pco-net-glyph">
        <BrandGlyph type={s.type} size={26} />
      </span>
      <span className="pco-net-text">
        <strong>{SOCIAL_LABELS[s.type]}</strong>
        <span>{label}</span>
      </span>
      <span className="pco-net-arrow">
        <ArrowUpRightIcon size={16} strokeWidth={1.9} />
      </span>
    </a>
  );
}

/** Professional / company template: arched portrait with a rotating tap badge, info strip, big contact panels, gradient link tiles. */
export function ProCompanyTemplate({ data, theme, meta }: TemplateProps) {
  const { profile, contact, style } = data;
  const design = meta.design ?? "starter";
  const m = buildCompanyModel(data, design);
  const fontPair = design === "standard" && style.fontPair && findFontPair("pro-company", style.fontPair) ? style.fontPair : undefined;
  const sectionTitle = (key: string) => m.sections.find((s) => s.key === key);

  const about = sectionTitle("about");
  const connect = sectionTitle("connect");
  const profilesSec = sectionTitle("profiles");
  const messagesSec = sectionTitle("messages");

  // The numbered blocks in page order. "Get in touch" (00) is always first and is not part of the order.
  const blocks: Record<string, ReactNode> = {
    about: about && profile.bio && (
      <section className="pco-sec" data-block="about">
        <SectionHead num={about.num} title={about.title} />
        <div className="pco-card pco-about">
          <div className="pco-about-quote">
            <span className="pco-quote-mark" aria-hidden="true">
              “
            </span>
            <p>{profile.bio}</p>
          </div>
        </div>
      </section>
    ),
    connect: connect && m.featured && (
      <section className="pco-sec" data-block="connect">
        <SectionHead num={connect.num} title={connect.title} />
        <a href={m.featured.url} className="pco-net pco-net-wide" data-net={m.featured.icon ?? "website"} target="_blank" rel="noopener noreferrer">
          <BrandGlyph type={m.featured.icon} size={140} className="pco-net-ghost" />
          <span className="pco-net-wide-chip">
            <BrandGlyph type={m.featured.icon} size={23} />
          </span>
          <span className="pco-net-text">
            <strong>{m.featured.label}</strong>
            <span>{m.featured.sub}</span>
          </span>
          <span className="pco-net-arrow">
            <ArrowUpRightIcon size={16} strokeWidth={1.9} />
          </span>
        </a>
      </section>
    ),
    profiles: profilesSec && (
      <section className="pco-sec" data-block="profiles">
        <SectionHead num={profilesSec.num} title={profilesSec.title} />
        <div className="pco-grid3" style={{ "--cols": Math.min(m.profiles.length, 3) } as CSSProperties}>
          {m.profiles.map((s) => (
            <TileLink key={`${s.type}-${s.handle}`} s={s} label={s.handle} />
          ))}
        </div>
      </section>
    ),
    messages: messagesSec && (
      <section className="pco-sec" data-block="messages">
        <SectionHead num={messagesSec.num} title={messagesSec.title} />
        <div className="pco-list">
          {m.messaging.map((s) => (
            <RowLink key={`${s.type}-${s.handle}`} s={s} label={messagingLabel(s, contact.showPhoneNumbers)} />
          ))}
        </div>
      </section>
    ),
  };
  for (const [kind, section] of Object.entries(m.extra)) {
    const head = sectionTitle(kind);
    if (!section || !head) continue;
    blocks[kind] = (
      <section className="pco-sec" data-block={kind}>
        <SectionHead num={head.num} title={head.title} />
        {BARE_KINDS.has(kind) ? (
          <SectionBody section={section} />
        ) : (
          <div className="pco-card pco-box">
            <SectionBody section={section} />
          </div>
        )}
      </section>
    );
  }

  return (
    <ThemeScope
      theme={theme}
      accent={style.accent}
      template="pro-company"
      className={FONT_CLASSES}
      attrs={{ "data-design": design, "data-font-pair": fontPair }}
    >
      <ToastProvider>
        <main className="pco">
          <header className="pco-stage">
            {m.initials && (
              <div className="pco-watermark" aria-hidden="true">
                {m.initials}
              </div>
            )}
            <div className="pco-glow" aria-hidden="true" />

            <div className="pco-topbar">
              {m.logoUrl ? (
                <span className="pco-logo">
                  <Image src={m.logoUrl} alt={m.company ? `${m.company} logo` : "Company logo"} width={120} height={20} unoptimized />
                </span>
              ) : m.company ? (
                <span className="pco-logo">
                  <BuildingIcon size={14} />
                  <span>{m.company}</span>
                </span>
              ) : (
                <span aria-hidden="true" />
              )}
              <div className="pco-topbar-actions">
                <TopThemeToggle />
                <TopShare url={meta.pageUrl} title={profile.fullName} />
              </div>
            </div>

            <div className="pco-arch-wrap">
              <div className="pco-arch-ring" aria-hidden="true" />
              <div className={`pco-arch${profile.photoUrl ? "" : " pco-arch-empty"}`}>
                {profile.photoUrl ? (
                  <Image
                    src={profile.photoUrl}
                    alt={`Photo of ${profile.fullName}`}
                    fill
                    sizes="256px"
                    unoptimized
                    priority
                  />
                ) : (
                  m.initials && (
                    <span className="pco-arch-initials" aria-hidden="true">
                      {m.initials}
                    </span>
                  )
                )}
                <div className="pco-arch-shade" />
              </div>
              <div className="pco-badge">
                <div className="pco-badge-ring" aria-hidden="true">
                  {Array.from(BADGE_RING_TEXT).map((ch, i) => (
                    <span key={i} style={{ transform: `rotate(${(i * RING_STEP).toFixed(2)}deg)` }}>
                      {ch === " " ? " " : ch}
                    </span>
                  ))}
                </div>
                <BadgeNfcIcon size={24} />
              </div>
            </div>

            <div className="pco-id">
              <h1 className="pco-name">{profile.fullName}</h1>
              {profile.title && <span className="pco-role">{profile.title}</span>}
            </div>

            {m.info.length > 0 && (
              <div className="pco-info" style={{ "--cols": m.info.length } as CSSProperties}>
                {m.info.map((i) => (
                  <div key={i.label}>
                    <span className="pco-info-label">{i.label}</span>
                    <span className="pco-info-value">{i.value}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pco-cta">
              <SaveButton href={meta.vcardHref} />
              <QrSheet qrHref={meta.qrHref} name={profile.fullName} url={displayUrl(meta.pageUrl)} />
            </div>
          </header>

          {m.hasTouch && (
            <section className="pco-sec pco-touch">
              <SectionHead num="00" title="Get in touch" />
              {m.phone && (
                <div className="pco-phone">
                  <span className="pco-phone-ghost" aria-hidden="true">
                    <PhoneIcon size={130} strokeWidth={1.4} />
                  </span>
                  <a href={m.phone.tel} className="pco-phone-main">
                    <span className="pco-kicker">Mobile</span>
                    <span className="pco-phone-number">{m.phone.display}</span>
                    {m.caption && <span className="pco-phone-note">{m.caption}</span>}
                  </a>
                  <div className="pco-phone-btns">
                    <a href={m.phone.tel} className="pco-round pco-round-call" aria-label="Call">
                      <PhoneIcon size={18} strokeWidth={2} />
                    </a>
                    <CopyButton text={m.phone.raw} label="Number" ariaLabel="Copy number" className="pco-round pco-round-copy" size={17} />
                  </div>
                </div>
              )}
              {m.email && (
                <div className="pco-card pco-email">
                  <span className="pco-ghost-mail" aria-hidden="true">
                    <MailIcon size={110} strokeWidth={1.4} />
                  </span>
                  <span className="pco-chip">
                    <MailIcon size={20} strokeWidth={1.9} />
                  </span>
                  <a href={`mailto:${m.email}`} className="pco-email-main">
                    <span className="pco-kicker">Email</span>
                    <span className="pco-email-value">{m.email}</span>
                  </a>
                  <CopyButton text={m.email} label="Email" ariaLabel="Copy email" className="pco-plain-btn" size={17} />
                </div>
              )}
              {m.tileCount > 0 && (
                <div className="pco-tiles" style={{ "--cols": m.tileCount } as CSSProperties}>
                  {m.sms && (
                    <a href={m.sms} className="pco-tile">
                      <span className="pco-tile-ghost" aria-hidden="true">
                        <MessageIcon size={110} strokeWidth={1.4} />
                      </span>
                      <span className="pco-tile-top">
                        <span className="pco-tile-chip">
                          <MessageIcon size={18} strokeWidth={1.9} />
                        </span>
                        <span className="pco-tile-arrow">
                          <ArrowUpRightIcon size={16} strokeWidth={1.9} />
                        </span>
                      </span>
                      <span className="pco-tile-text">
                        <span className="pco-kicker">Text message</span>
                        <strong>Send an SMS</strong>
                      </span>
                    </a>
                  )}
                  {m.office && (
                    <a href={m.office.href} className="pco-tile pco-tile-map" target="_blank" rel="noopener noreferrer">
                      <span className="pco-pin" aria-hidden="true">
                        <span>
                          <MapPinIcon size={14} strokeWidth={2.2} />
                        </span>
                      </span>
                      <span />
                      <span className="pco-map-label">
                        <span className="pco-kicker">Office</span>
                        <strong>{m.office.label}</strong>
                      </span>
                    </a>
                  )}
                </div>
              )}
            </section>
          )}

          {m.sections.map(({ key }) => (
            <Fragment key={key}>{blocks[key]}</Fragment>
          ))}

          <Footer tagline="Always one tap away." showBranding={meta.showBranding} className="pco-footer" />
        </main>
      </ToastProvider>
    </ThemeScope>
  );
}
