import Image from "next/image";
import type { CSSProperties } from "react";
import { Footer } from "@/components/Footer";
import { ArrowUpRightIcon } from "@/components/icons";
import { BrandGlyph } from "@/components/SocialIcon";
import { BRAND_NAME } from "@/lib/site";
import { SOCIAL_LABELS } from "@/lib/socials";
import { ThemeScope } from "../ThemeScope";
import { displayUrl } from "../shared/model";
import { tileHandle } from "../shared/social";
import type { TemplateProps } from "../types";
import { instrumentSerif, interTight, minimalMono } from "./fonts";
import { HeaderShare, HeaderThemeToggle, QrSheet, SaveButton, ToastProvider } from "./interactive";
import { buildMinimalModel, buildStandardModel } from "./model";
import { SectionBlock } from "./sections";
import "./social-minimalist.css";

/** Social template: minimal. A huge first name, one photo with a spinning "say hi" badge, tiles, and an italic serif accent voice. */
export function SocialMinimalistTemplate({ data, theme, meta }: TemplateProps) {
  const { profile, contact, style } = data;
  const m = buildMinimalModel(data);
  const standard = buildStandardModel(data, meta.design ?? "starter");

  return (
    <ThemeScope
      theme={theme}
      accent={style.accent}
      template="social-minimalist"
      attrs={meta.design === "standard" ? { "data-design": "standard" } : undefined}
      className={`${interTight.variable} ${instrumentSerif.variable} ${minimalMono.variable}`}
    >
      <ToastProvider>
        <main className="mn">
          <div className="mn-top">
            {meta.showBranding ? <span className="mn-brand">[{BRAND_NAME.toUpperCase()}]</span> : <span aria-hidden="true" />}
            <div className="mn-top-actions">
              <HeaderThemeToggle />
              <HeaderShare url={meta.pageUrl} title={profile.fullName} />
            </div>
          </div>

          <div className="mn-intro">
            {(m.program || m.school) && (
              <div className="mn-line">
                <span className="mn-dot" aria-hidden="true" />
                {m.program && <span>{m.program}</span>}
                {m.program && m.school && (
                  <span className="mn-slash" aria-hidden="true">
                    /
                  </span>
                )}
                {m.school && <span>{m.school}</span>}
              </div>
            )}
            {m.name && (
              <h1 className="mn-name" style={{ "--n": m.nameChars } as CSSProperties}>
                {m.name}
                <span className="mn-name-dot">.</span>
              </h1>
            )}
          </div>

          <div className="mn-photo-block">
            <div className={`mn-photo${profile.photoUrl ? "" : " mn-photo-empty"}`}>
              {profile.photoUrl ? (
                <Image src={profile.photoUrl} alt={`Photo of ${profile.fullName}`} fill sizes="358px" unoptimized priority />
              ) : (
                <span className="mn-photo-initials" aria-hidden="true">
                  {m.initials}
                </span>
              )}
            </div>
            {profile.photoUrl && (
              <div className="mn-badge" aria-hidden="true">
                <svg className="mn-badge-ring" width="104" height="104" viewBox="0 0 100 100">
                  <defs>
                    <path id="mn-say-hi" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" />
                  </defs>
                  <text fill="currentColor" className="mn-badge-text">
                    <textPath href="#mn-say-hi">SAY HI · SAY HI · SAY HI · </textPath>
                  </text>
                </svg>
                <ArrowUpRightIcon size={22} strokeWidth={2} />
              </div>
            )}
          </div>

          {m.bio && (
            <p className="mn-tagline">
              {m.bio.lead && <em>{m.bio.lead}</em>}
              {m.bio.rest}
            </p>
          )}

          {m.hero && (
            <div className="mn-follow-wrap">
              <a href={m.hero.url} className="mn-follow" target="_blank" rel="noopener noreferrer">
                <span className="mn-follow-text">
                  <span className="mn-follow-title">{m.hero.label}</span>
                  <span className="mn-follow-sub">{m.hero.sub}</span>
                </span>
                <span className="mn-follow-chip">
                  <BrandGlyph type={m.hero.type} size={22} />
                </span>
              </a>
            </div>
          )}

          {m.cards.length > 0 && (
            <div className="mn-tiles">
              {m.cards.map((link) => (
                <a
                  key={`${link.type}-${link.handle}`}
                  href={link.url}
                  className="mn-tile"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="mn-tile-top">
                    <span className="mn-chip" data-net={link.type}>
                      <BrandGlyph type={link.type} size={18} />
                    </span>
                    <ArrowUpRightIcon size={16} strokeWidth={1.8} />
                  </span>
                  <span className="mn-tile-text">
                    <span className="mn-tile-name">{SOCIAL_LABELS[link.type]}</span>
                    <span className="mn-tile-handle">{tileHandle(link, contact.showPhoneNumbers)}</span>
                  </span>
                </a>
              ))}
            </div>
          )}

          {m.icons.length > 0 && (
            <div className="mn-also">
              <span className="mn-also-label">Also on</span>
              <div className="mn-also-icons">
                {m.icons.map((s) => (
                  <a
                    key={`${s.type}-${s.handle}`}
                    href={s.url}
                    className="mn-also-icon"
                    aria-label={SOCIAL_LABELS[s.type]}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <BrandGlyph type={s.type} size={s.type === "x" ? 16 : s.type === "spotify" ? 19 : 18} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {standard && standard.order.length > 0 && (
            <div className="mn-extras">
              {standard.order.map((kind) => {
                const section = standard.blocks[kind];
                return section ? <SectionBlock key={kind} section={section} /> : null;
              })}
            </div>
          )}

          <div className="mn-contact-wrap">
            <section className="mn-contact">
              <div className="mn-contact-head">
                <h2 className="mn-contact-title">
                  Want my <em>contact?</em>
                </h2>
                <p className="mn-contact-line">{m.contactLine}</p>
              </div>
              <div className="mn-contact-row">
                <SaveButton href={meta.vcardHref} />
                <QrSheet qrHref={meta.qrHref} name={m.name || profile.fullName} url={displayUrl(meta.pageUrl)} />
              </div>
              {m.callText && (
                <div className="mn-callrow" style={{ "--cols": m.callText.text ? 2 : 1 } as CSSProperties}>
                  <a href={m.callText.call}>Call</a>
                  {m.callText.text && <a href={m.callText.text}>Text</a>}
                </div>
              )}
            </section>
          </div>

          <Footer tagline="Always One Tap Away." showBranding={meta.showBranding} className="mn-footer" />
        </main>
      </ToastProvider>
    </ThemeScope>
  );
}
