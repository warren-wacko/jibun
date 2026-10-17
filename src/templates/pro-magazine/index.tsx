import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowUpRightIcon,
  CalendarIcon,
  ChevronRightIcon,
  MailIcon,
  MapPinIcon,
  MessageIcon,
  PhoneIcon,
} from "@/components/icons";
import { Footer } from "@/components/Footer";
import { SocialIcon } from "@/components/SocialIcon";
import { BRAND_NAME } from "@/lib/site";
import { SOCIAL_LABELS } from "@/lib/socials";
import type { SocialLink } from "@/lib/page-schema";
import { ThemeScope } from "../ThemeScope";
import { displayUrl } from "../shared/model";
import type { TemplateProps } from "../types";
import { archivo, plexMono } from "./fonts";
import { BottomBar, CopyEmail, CoverShare, CoverThemeToggle, ToastProvider } from "./interactive";
import { buildMagazineModel, type TouchRow } from "./model";
import "./pro-magazine.css";

function RowIcon({ row }: { row: TouchRow }) {
  const primary = row.key === "call";
  const size = primary ? 26 : 24;
  const strokeWidth = primary ? 2.1 : 2;
  switch (row.key) {
    case "call":
      return <PhoneIcon size={size} strokeWidth={strokeWidth} />;
    case "text":
      return <MessageIcon size={size} strokeWidth={strokeWidth} />;
    case "email":
      return <MailIcon size={size} strokeWidth={strokeWidth} />;
    case "directions":
      return <MapPinIcon size={size} strokeWidth={strokeWidth} />;
    case "book":
      return <CalendarIcon size={size} strokeWidth={strokeWidth} />;
  }
}

function LinkList({ title, links }: { title: string; links: SocialLink[] }) {
  return (
    <div className="pm-list">
      <span className="pm-label">{title}</span>
      {links.map((s) => (
        <a key={`${s.type}-${s.handle}`} href={s.url} target="_blank" rel="noopener noreferrer">
          <SocialIcon type={s.type} size={26} glyphSize={14} radius={7} />
          {SOCIAL_LABELS[s.type]}
        </a>
      ))}
    </div>
  );
}

function Section({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={`pm-section ${className ?? ""}`}>{children}</section>;
}

/** Professional / contact-first template: full-bleed cover photo, giant headline, big action rows, sticky Save Contact bar. */
export function ProMagazineTemplate({ data, theme, meta }: TemplateProps) {
  const { profile, style } = data;
  const m = buildMagazineModel(data);
  const listCount = Number(m.profiles.length > 0) + Number(m.messaging.length > 0);

  return (
    <ThemeScope
      theme={theme}
      accent={style.accent}
      template="pro-magazine"
      className={`${archivo.variable} ${plexMono.variable}`}
    >
      <ToastProvider>
        <main className="pm">
          <header className="pm-cover">
            {profile.photoUrl && (
              <Image
                src={profile.photoUrl}
                alt={`Portrait of ${profile.fullName}`}
                fill
                sizes="(max-width: 430px) 100vw, 430px"
                className="pm-cover-photo"
                unoptimized
                priority
              />
            )}
            <div className="pm-cover-shade" aria-hidden="true" />

            <div className="pm-cover-top">
              {meta.showBranding ? (
                <span className="pm-brand">[{BRAND_NAME.toUpperCase()}]</span>
              ) : (
                <span aria-hidden="true" />
              )}
              <div className="pm-cover-actions">
                <CoverThemeToggle />
                <CoverShare url={meta.pageUrl} title={profile.fullName} />
              </div>
            </div>

            <div className="pm-issue" aria-hidden="true">
              <span>ISSUE NO. 01</span>
              <span>THE PROFESSIONAL EDITION</span>
            </div>

            <div className="pm-headline">
              <span className="pm-chip">COVER STORY</span>
              <h1 className="pm-name" style={{ "--em": m.nameEm } as CSSProperties}>
                {m.nameLines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </h1>
              {m.titleParts.length > 0 && (
                <div className="pm-subtitle">
                  <span>{m.titleParts[0]}</span>
                  {m.titleParts[1] && (
                    <>
                      <span className="pm-subtitle-rule" aria-hidden="true" />
                      <span className="pm-subtitle-second">{m.titleParts[1]}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </header>

          {profile.bio && (
            <section className="pm-brief">
              <span className="pm-label">In brief</span>
              <p className="pm-bio">{profile.bio}</p>
            </section>
          )}

          {m.rows.length > 0 && (
            <Section>
              <div className="pm-touch-head">
                <span className="pm-label">Get in touch</span>
                <span className="pm-touch-title">Tap a button to reach me.</span>
                <span className="pm-touch-note">Your phone will open the right app for you.</span>
              </div>
              <div className="pm-rows">
                {m.rows.map((row) => (
                  <a
                    key={row.key}
                    href={row.href}
                    className={`pm-row${row.key === "call" ? " pm-row-primary" : ""}`}
                    {...(row.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    <span className="pm-row-icon">
                      <RowIcon row={row} />
                    </span>
                    <span className="pm-row-text">
                      <span className="pm-row-title">{row.title}</span>
                      {row.sub && <span className="pm-row-sub">{row.sub}</span>}
                    </span>
                    <ChevronRightIcon size={22} strokeWidth={2.2} className="pm-row-chevron" />
                  </a>
                ))}
              </div>
            </Section>
          )}

          {(m.featured || m.email) && (
            <Section className="pm-connect">
              <span className="pm-label">Connect</span>
              {m.featured && (
                <a
                  href={m.featured.url}
                  className="pm-link-row pm-link-row-featured"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SocialIcon type={m.featured.icon} size={40} glyphSize={19} radius={0} />
                  <span className="pm-link-text">
                    <span className="pm-link-title">{m.featured.label}</span>
                    <span className="pm-link-sub">{m.featured.sub}</span>
                  </span>
                  <ArrowUpRightIcon size={18} className="pm-link-arrow" />
                </a>
              )}
              {m.email && (
                <div className="pm-link-row pm-email-row">
                  <MailIcon size={18} />
                  <a href={`mailto:${m.email}`}>{m.email}</a>
                  <CopyEmail email={m.email} />
                </div>
              )}
            </Section>
          )}

          {listCount > 0 && (
            <div className="pm-lists" style={{ "--cols": listCount } as CSSProperties}>
              {m.profiles.length > 0 && <LinkList title="Profiles to view" links={m.profiles} />}
              {m.messaging.length > 0 && <LinkList title="Ways to message" links={m.messaging} />}
            </div>
          )}

          <Footer tagline="Always one tap away." showBranding={meta.showBranding} className="pm-footer" />

          <BottomBar
            vcardHref={meta.vcardHref}
            qrHref={meta.qrHref}
            name={profile.fullName}
            displayUrl={displayUrl(meta.pageUrl)}
          />
        </main>
      </ToastProvider>
    </ThemeScope>
  );
}
