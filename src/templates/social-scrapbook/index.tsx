import Image from "next/image";
import { buildVCard } from "@/lib/vcard";
import type { CSSProperties } from "react";
import { Footer } from "@/components/Footer";
import { BrandGlyph } from "@/components/SocialIcon";
import { BRAND_NAME } from "@/lib/site";
import { SOCIAL_LABELS } from "@/lib/socials";
import { ThemeScope } from "../ThemeScope";
import { displayUrl } from "../shared/model";
import { tileHandle } from "../shared/social";
import type { TemplateProps } from "../types";
import { archivoBlack, courierPrime, gloock, scrapHand } from "./fonts";
import { HeaderShare, HeaderThemeToggle, QrSheet, SaveButton, ToastProvider } from "./interactive";
import { buildScrapbookModel, buildStandardModel } from "./model";
import { SectionBlock } from "./sections";
import { TORN_CLIP } from "./torn";
import "./social-scrapbook.css";

/** Social template: a scrapbook page. Torn-edge photo with tape, letter-cutout name, a ticket, sticky cards and a receipt. */
export function SocialScrapbookTemplate({ data, theme, meta }: TemplateProps) {
  const { profile, contact, style } = data;
  const m = buildScrapbookModel(data);
  const vcard = buildVCard(data, { pageUrl: meta.pageUrl });
  const standard = buildStandardModel(data, meta.design ?? "starter");

  return (
    <ThemeScope
      theme={theme}
      accent={style.accent}
      template="social-scrapbook"
      attrs={meta.design === "standard" ? { "data-design": "standard" } : undefined}
      className={`${archivoBlack.variable} ${gloock.variable} ${courierPrime.variable} ${scrapHand.variable}`}
    >
      <ToastProvider>
        <main className="pk">
          <div className="pk-top">
            {meta.showBranding ? <span className="pk-brand">[{BRAND_NAME.toUpperCase()}]</span> : <span aria-hidden="true" />}
            <div className="pk-top-actions">
              <HeaderThemeToggle />
              <HeaderShare url={meta.pageUrl} title={profile.fullName} />
            </div>
          </div>

          <div className="pk-scene">
            <div className="pk-photo-wrap">
              <div className="pk-photo-paper" style={{ clipPath: TORN_CLIP, WebkitClipPath: TORN_CLIP } as CSSProperties}>
                <div className={`pk-photo${profile.photoUrl ? "" : " pk-photo-empty"}`}>
                  {profile.photoUrl ? (
                    <Image src={profile.photoUrl} alt={`Photo of ${profile.fullName}`} fill sizes="290px" unoptimized priority />
                  ) : (
                    <span className="pk-photo-initials" aria-hidden="true">
                      {m.initials}
                    </span>
                  )}
                </div>
              </div>
              <div className="pk-tape pk-tape-left" aria-hidden="true" />
              <div className="pk-tape pk-tape-right" aria-hidden="true" />
            </div>

            {m.badge && <div className="pk-badge">{m.badge}</div>}
            <div className="pk-hi" aria-hidden="true">
              hi!
            </div>
            {m.school && <div className="pk-school">{m.school}</div>}
          </div>

          {m.letterRows.length > 0 && (
            <h1 className="pk-letters" style={{ "--ls": m.letterScale } as CSSProperties} aria-label={m.name}>
              {m.letterRows.map((row, r) => (
                <span key={r} className="pk-letter-row" aria-hidden="true">
                  {row.map((l, i) =>
                    "space" in l ? (
                      <span key={i} className="pk-gap" />
                    ) : (
                      <span key={i} className={`pk-letter pk-l${l.style}`}>
                        {l.ch}
                      </span>
                    ),
                  )}
                </span>
              ))}
            </h1>
          )}

          {m.tagline && (
            <p className="pk-tagline">
              <span>{m.tagline}</span>
            </p>
          )}

          <div className="pk-checker" aria-hidden="true" />

          {m.hero && (
            <div className="pk-ticket-wrap">
              <a href={m.hero.url} className="pk-ticket" target="_blank" rel="noopener noreferrer">
                <span className="pk-ticket-main">
                  <span className="pk-ticket-kicker">ADMIT ONE · NO. 0001</span>
                  <span className="pk-ticket-title">{m.hero.label}</span>
                  <span className="pk-ticket-sub">{m.hero.sub}</span>
                </span>
                <span className="pk-ticket-stub">
                  <span className="pk-ticket-chip">
                    <BrandGlyph type={m.hero.type} size={24} />
                  </span>
                </span>
              </a>
            </div>
          )}

          {m.cards.length > 0 && (
            <div className="pk-cards">
              {m.cards.map(({ link, variant }) => (
                <a
                  key={`${link.type}-${link.handle}`}
                  href={link.url}
                  className="pk-card"
                  data-v={variant}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="pk-card-tape" aria-hidden="true" />
                  <span className="pk-card-chip" data-net={link.type}>
                    <BrandGlyph type={link.type} size={19} />
                  </span>
                  <span className="pk-card-text">
                    <span className="pk-card-name">{SOCIAL_LABELS[link.type]}</span>
                    <span className="pk-card-note">{tileHandle(link, contact.showPhoneNumbers)}</span>
                  </span>
                </a>
              ))}
            </div>
          )}

          {m.receipt.length > 0 && (
            <div className="pk-receipt-wrap">
              <div className="pk-receipt">
                <div className="pk-receipt-paper">
                  <div className="pk-receipt-title">ALSO FIND ME ON</div>
                  <div className="pk-receipt-sub">receipt no. 0042 · thank u for scrolling</div>
                  <div className="pk-rule" />
                  {m.receipt.map((s) => (
                    <a key={`${s.type}-${s.handle}`} href={s.url} className="pk-receipt-row" target="_blank" rel="noopener noreferrer">
                      <span className="pk-receipt-dot" data-net={s.type} aria-hidden="true" />
                      <span className="pk-receipt-name">{SOCIAL_LABELS[s.type]}</span>
                      <span className="pk-receipt-leader" aria-hidden="true" />
                      <span className="pk-receipt-handle">{s.handle}</span>
                    </a>
                  ))}
                  <div className="pk-rule pk-rule-end" />
                  <div className="pk-receipt-total">
                    <span>TOTAL</span>
                    <span>
                      {m.receipt.length} {m.receipt.length === 1 ? "social" : "socials"}
                    </span>
                  </div>
                  <div className="pk-barcode" aria-hidden="true" />
                </div>
              </div>
            </div>
          )}

          {standard && standard.order.length > 0 && (
            <div className="pk-extras">
              {standard.order.map((kind) => {
                const section = standard.blocks[kind];
                return section ? <SectionBlock key={kind} section={section} /> : null;
              })}
            </div>
          )}

          <div className="pk-contact-wrap">
            <section className="pk-contact">
              <div className="pk-contact-tape" aria-hidden="true" />
              <div>
                <h2>want my contact?</h2>
                <p>{m.contactLine}</p>
              </div>
              <div className="pk-contact-row">
                <SaveButton href={meta.vcardHref} vcard={vcard} />
                <QrSheet qrHref={meta.qrHref} name={m.name || profile.fullName} url={displayUrl(meta.pageUrl)} />
              </div>
              {m.callText && (
                <div className="pk-callrow" style={{ "--cols": m.callText.text ? 2 : 1 } as CSSProperties}>
                  <a href={m.callText.call}>Call</a>
                  {m.callText.text && <a href={m.callText.text}>Text</a>}
                </div>
              )}
            </section>
          </div>

          <Footer tagline="Always One Tap Away." showBranding={meta.showBranding} className="pk-footer" />
        </main>
      </ToastProvider>
    </ThemeScope>
  );
}
