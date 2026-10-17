import Image from "next/image";
import type { CSSProperties } from "react";
import { ArrowUpRightIcon, MailIcon, MessageIcon, PhoneIcon } from "@/components/icons";
import { Footer } from "@/components/Footer";
import { BrandGlyph, SocialIcon } from "@/components/SocialIcon";
import { BRAND_NAME } from "@/lib/site";
import { SOCIAL_LABELS } from "@/lib/socials";
import type { SocialLink } from "@/lib/page-schema";
import { ThemeScope } from "../ThemeScope";
import type { TemplateProps } from "../types";
import { handwriting, notebookMono, schibsted } from "./fonts";
import { CopyEmail, HeaderShare, HeaderThemeToggle, PolaroidFlip, SaveButton, ToastProvider } from "./interactive";
import { buildNotebookModel, type QuickAction } from "./model";
import "./student-notebook.css";

function QuickIcon({ action }: { action: QuickAction }) {
  switch (action.key) {
    case "call":
      return <PhoneIcon size={20} />;
    case "email":
      return <MailIcon size={20} />;
    case "text":
      return <MessageIcon size={20} />;
    case "linkedin":
      return <BrandGlyph type="linkedin" size={20} />;
  }
}

function TileGrid({ links }: { links: SocialLink[] }) {
  return (
    <div className="pn-grid" style={{ "--cols": Math.min(links.length, 3) } as CSSProperties}>
      {links.map((s) => (
        <a key={`${s.type}-${s.handle}`} href={s.url} className="pn-tile" target="_blank" rel="noopener noreferrer">
          <SocialIcon type={s.type} size={32} glyphSize={16} radius={9} />
          {SOCIAL_LABELS[s.type]}
        </a>
      ))}
    </div>
  );
}

/** Student template: a taped polaroid that flips to a QR code, a sticky note, a highlighter underline and notebook paper. */
export function StudentNotebookTemplate({ data, theme, meta }: TemplateProps) {
  const { profile, style } = data;
  const m = buildNotebookModel(data);

  return (
    <ThemeScope
      theme={theme}
      accent={style.accent}
      template="student-notebook"
      className={`${schibsted.variable} ${handwriting.variable} ${notebookMono.variable}`}
    >
      <ToastProvider>
        <main className="pn">
          <header className="pn-header">
            {meta.showBranding ? <span className="pn-brand">[{BRAND_NAME.toUpperCase()}]</span> : <span aria-hidden="true" />}
            <div className="pn-header-actions">
              <HeaderThemeToggle />
              <HeaderShare url={meta.pageUrl} title={profile.fullName} />
            </div>
          </header>

          <div className="pn-scene-box">
            <div className="pn-scene">
              <PolaroidFlip
                tape={<div className="pn-tape" aria-hidden="true" />}
                front={
                  <>
                    <div className="pn-photo">
                      {profile.photoUrl ? (
                        <Image
                          src={profile.photoUrl}
                          alt={`Portrait of ${profile.fullName}`}
                          fill
                          sizes="214px"
                          unoptimized
                          priority
                        />
                      ) : (
                        m.initials && (
                          <span className="pn-photo-initials" aria-hidden="true">
                            {m.initials}
                          </span>
                        )
                      )}
                    </div>
                    {m.greeting && <span className="pn-caption">hi, I’m {m.greeting}!</span>}
                  </>
                }
                back={
                  <>
                    <div className="pn-qr">
                      <Image src={meta.qrHref} alt={`QR code for ${profile.fullName}'s card`} width={168} height={168} unoptimized />
                    </div>
                    <span className="pn-caption" style={{ flex: "none" }}>
                      scan to save me
                    </span>
                  </>
                }
              />

              {m.sticky && (
                <div className="pn-sticky">
                  <span className="pn-sticky-label">OPEN TO</span>
                  <span className="pn-sticky-text">{m.sticky.openTo}</span>
                  {m.sticky.note && <span className="pn-sticky-note">{m.sticky.note}</span>}
                </div>
              )}

              <div className="pn-hint" aria-hidden="true">
                <svg width="40" height="30" viewBox="0 0 40 30" fill="none">
                  <path d="M38 4C28 2 14 6 6 22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M3 15l3 8 8-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>tap my photo for a QR</span>
              </div>
            </div>
          </div>

          <div className="pn-id">
            <h1 className="pn-name">{profile.fullName}</h1>
            {m.programLine && (
              <div className="pn-program">
                <span className="pn-mark" aria-hidden="true" />
                <span className="pn-program-text">{m.programLine}</span>
              </div>
            )}
            {m.schoolLine && <span className="pn-school">{m.schoolLine}</span>}
          </div>

          <div className="pn-actions">
            <SaveButton href={meta.vcardHref} />
            {m.quick.length > 0 && (
              <nav className="pn-quick" aria-label="Contact actions" style={{ "--cols": Math.min(m.quick.length, 4) } as CSSProperties}>
                {m.quick.map((a) => (
                  <a key={a.key} href={a.href} {...(a.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    <QuickIcon action={a} />
                    {a.label}
                  </a>
                ))}
              </nav>
            )}
          </div>

          {profile.bio && (
            <div className="pn-paper-wrap">
              <div className="pn-paper">
                <div className="pn-paper-margin" aria-hidden="true" />
                <span className="pn-paper-label">About me</span>
                <p>{profile.bio}</p>
              </div>
            </div>
          )}

          {(m.featured || m.email) && (
            <section className="pn-section pn-connect">
              <span className="pn-h2">Connect</span>
              {m.featured && (
                <a href={m.featured.url} className="pn-link-row" target="_blank" rel="noopener noreferrer">
                  <SocialIcon type={m.featured.icon} size={38} glyphSize={18} radius={10} />
                  <span className="pn-link-text">
                    <span className="pn-link-title">{m.featured.label}</span>
                    <span className="pn-link-sub">{m.featured.sub}</span>
                  </span>
                  <ArrowUpRightIcon size={18} strokeWidth={1.9} className="pn-link-arrow" />
                </a>
              )}
              {m.email && (
                <div className="pn-email-row">
                  <MailIcon size={18} />
                  <a href={`mailto:${m.email}`}>{m.email}</a>
                  <CopyEmail email={m.email} />
                </div>
              )}
            </section>
          )}

          {m.profiles.length > 0 && (
            <section className="pn-section">
              <span className="pn-h3">Profiles to view</span>
              <TileGrid links={m.profiles} />
            </section>
          )}

          {m.messaging.length > 0 && (
            <section className="pn-section" style={{ paddingTop: 26 }}>
              <span className="pn-h3">Ways to message</span>
              <TileGrid links={m.messaging} />
            </section>
          )}

          <Footer tagline="Always One Tap Away." showBranding={meta.showBranding} className="pn-footer" />
        </main>
      </ToastProvider>
    </ThemeScope>
  );
}
