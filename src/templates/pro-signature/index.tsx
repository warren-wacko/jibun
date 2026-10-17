import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
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
import { displayUrl } from "../shared/model";
import type { TemplateProps } from "../types";
import { caveat, dmMono, jakarta } from "./fonts";
import { CardFlip, CopyEmail, HeaderShare, HeaderThemeToggle, SaveButton, ToastProvider } from "./interactive";
import { buildSignatureModel } from "./model";
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
}: {
  title: string;
  links: SocialLink[];
  label: (link: SocialLink) => string;
  className?: string;
}) {
  return (
    <section className={`ps-section ${className ?? ""}`}>
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

function Block({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={`ps-section ${className ?? ""}`}>{children}</section>;
}

/** Professional / contact-first template: portrait flip card with QR on the back and a handwritten sign-off. */
export function ProSignatureTemplate({ data, theme, meta }: TemplateProps) {
  const { profile, contact, style } = data;
  const m = buildSignatureModel(data);

  return (
    <ThemeScope
      theme={theme}
      accent={style.accent}
      template="pro-signature"
      className={`${jakarta.variable} ${dmMono.variable} ${caveat.variable}`}
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

          {profile.bio && (
            <section className="ps-about">
              <span className="ps-label">About</span>
              <p className="ps-quote">“{profile.bio}”</p>
              {m.signature && <span className="ps-signature">{m.signature}</span>}
              <div className="ps-rule" aria-hidden="true" />
            </section>
          )}

          {(m.featured || m.email) && (
            <Block className="ps-connect">
              <span className="ps-label">Connect</span>
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
            </Block>
          )}

          {m.profiles.length > 0 && (
            <LinkList title="Profiles to view" links={m.profiles} label={(s) => s.handle} className="ps-section-profiles" />
          )}
          {m.messaging.length > 0 && (
            <LinkList title="Ways to message" links={m.messaging} label={(s) => messagingLabel(s, contact.showPhoneNumbers)} />
          )}

          <Footer tagline="Always one tap away." showBranding={meta.showBranding} className="ps-footer" />
        </main>
      </ToastProvider>
    </ThemeScope>
  );
}
