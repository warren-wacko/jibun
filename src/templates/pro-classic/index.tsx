import Image from "next/image";
import type { ReactNode } from "react";
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
import type { TemplateProps } from "../types";
import { bricolage, jetbrainsMono } from "./fonts";
import { CardFlip, CopyEmail, HeaderShare, HeaderThemeToggle, SaveButton, ToastProvider } from "./interactive";
import { buildModel, displayUrl } from "./model";
import "./pro-classic.css";

const ACTION_ICON = {
  call: <PhoneIcon />,
  email: <MailIcon />,
  text: <MessageIcon />,
  directions: <MapPinIcon />,
  book: <CalendarIcon />,
} as const;

function Section({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section className={`pc-section ${className ?? ""}`}>
      <span className="pc-label">{title}</span>
      {children}
    </section>
  );
}

function TileGrid({ links, label }: { links: SocialLink[]; label: (link: SocialLink) => string }) {
  // 1 item fills the row, 2 split it, 3+ make rows of three.
  const cols = Math.min(links.length, 3);
  return (
    <div className="pc-grid" style={{ "--cols": cols } as React.CSSProperties}>
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

/** Professional / contact-first template with a flip card (holographic shine, QR on the back). */
export function ProClassicTemplate({ data, theme, meta }: TemplateProps) {
  const { profile, contact, style } = data;
  const m = buildModel(data);

  return (
    <ThemeScope
      theme={theme}
      accent={style.accent}
      template="pro-classic"
      className={`${bricolage.variable} ${jetbrainsMono.variable}`}
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
            <SaveButton href={meta.vcardHref} />
            {m.actions.length > 0 && (
              <nav
                className="pc-quick"
                aria-label="Contact actions"
                style={{ "--cols": Math.min(m.actions.length, 4) } as React.CSSProperties}
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

          {profile.bio && (
            <section className="pc-section pc-about">
              <span className="pc-label">About</span>
              <p>{profile.bio}</p>
            </section>
          )}

          {(m.featured || m.email) && (
            <Section title="Connect" className="pc-connect">
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
            </Section>
          )}

          {m.profiles.length > 0 && (
            <Section title="Profiles to view">
              <TileGrid links={m.profiles} label={(s) => s.handle} />
            </Section>
          )}

          {m.messaging.length > 0 && (
            <Section title="Ways to message">
              <TileGrid links={m.messaging} label={(s) => messagingLabel(s, contact.showPhoneNumbers)} />
            </Section>
          )}

          <Footer tagline="Always one tap away." showBranding={meta.showBranding} className="pc-footer" />
        </main>
      </ToastProvider>
    </ThemeScope>
  );
}
