import Image from "next/image";
import type { CSSProperties } from "react";
import { ArrowUpRightIcon, NfcIcon } from "@/components/icons";
import { Footer } from "@/components/Footer";
import { BrandGlyph } from "@/components/SocialIcon";
import { BRAND_NAME } from "@/lib/site";
import { SOCIAL_LABELS } from "@/lib/socials";
import { ThemeScope } from "../ThemeScope";
import { displayUrl } from "../shared/model";
import type { TemplateProps } from "../types";
import { bentoHand, bentoMono, spaceGrotesk } from "./fonts";
import { QrSheet, SaveButton, ShareTile, ThemeTile, ToastProvider } from "./interactive";
import { SOLID_TYPES, buildBentoModel, buildStandardModel, tileHandle, type BentoTile } from "./model";
import { SectionBlock } from "./sections";
import "./social-bento.css";

const span = (t: { colSpan: number; rowSpan: number }, i: number): CSSProperties =>
  ({
    gridColumn: t.colSpan > 1 ? `span ${t.colSpan}` : undefined,
    gridRow: t.rowSpan > 1 ? `span ${t.rowSpan}` : undefined,
    "--d": `${260 + i * 40}ms`,
  }) as CSSProperties;

function Tile({ tile, index, showPhoneNumbers }: { tile: BentoTile; index: number; showPhoneNumbers: boolean }) {
  if (tile.kind === "status") return null; // rendered by the caller (needs the status text)
  const { link } = tile;
  const label = SOCIAL_LABELS[link.type];
  const handle = tileHandle(link, showPhoneNumbers);
  const common = { href: link.url, target: "_blank", rel: "noopener noreferrer", style: span(tile, index) } as const;

  if (tile.kind === "icon") {
    return (
      <a {...common} className="pb-tile pb-icon" data-net={link.type} aria-label={label}>
        <BrandGlyph type={link.type} size={tile.colSpan > 1 ? 30 : 26} />
      </a>
    );
  }

  if (tile.kind === "big") {
    return (
      <a {...common} className="pb-tile pb-big" data-net={link.type}>
        <BrandGlyph type={link.type} size={150} className="pb-big-ghost" />
        <span className="pb-big-top">
          <BrandGlyph type={link.type} size={28} />
          <ArrowUpRightIcon size={18} strokeWidth={2} className="pb-big-arrow" />
        </span>
        <span className="pb-big-text">
          <strong>{label}</strong>
          <span>{handle}</span>
        </span>
      </a>
    );
  }

  if (SOLID_TYPES.includes(link.type)) {
    return (
      <a {...common} className="pb-tile pb-wide pb-wide-solid" data-net={link.type}>
        <BrandGlyph type={link.type} size={30} />
        <span className="pb-wide-text">
          <strong>{label}</strong>
          <span>{handle}</span>
        </span>
      </a>
    );
  }

  return (
    <a {...common} className="pb-tile pb-wide" data-net={link.type}>
      <span className="pb-wide-chip" data-net={link.type}>
        <BrandGlyph type={link.type} size={19} />
      </span>
      <span className="pb-wide-text">
        <strong>{label}</strong>
        <span>{handle}</span>
      </span>
    </a>
  );
}

/** Social template: a bento grid. Tiles appear, resize and reflow to fit whichever links the person has. */
export function SocialBentoTemplate({ data, theme, meta }: TemplateProps) {
  const { profile, contact, style } = data;
  const m = buildBentoModel(data);
  const standard = buildStandardModel(data, meta.design ?? "starter");

  return (
    <ThemeScope
      theme={theme}
      accent={style.accent}
      template="social-bento"
      attrs={meta.design === "standard" ? { "data-design": "standard" } : undefined}
      className={`${spaceGrotesk.variable} ${bentoHand.variable} ${bentoMono.variable}`}
    >
      <ToastProvider>
        <main className="pb">
          <div className="pb-top">
            {meta.showBranding ? <span>[{BRAND_NAME.toUpperCase()}]</span> : <span aria-hidden="true" />}
            <span>tap a tile</span>
          </div>

          <div className="pb-grid">
            <div className={`pb-tile pb-photo${profile.photoUrl ? "" : " pb-photo-empty"}`} style={{ "--d": "0ms" } as CSSProperties}>
              {profile.photoUrl ? (
                <Image src={profile.photoUrl} alt={`Photo of ${profile.fullName}`} fill sizes="(max-width: 430px) 75vw, 320px" unoptimized priority />
              ) : (
                <span className="pb-photo-initials" aria-hidden="true">
                  {m.initials}
                </span>
              )}
              {m.greeting && <span className="pb-photo-chip">hi, I’m {m.greeting}</span>}
            </div>

            <ThemeTile />
            <ShareTile url={meta.pageUrl} title={profile.fullName} />

            <div className="pb-tile pb-badge" style={{ "--d": "140ms" } as CSSProperties}>
              {m.badge ? (
                <>
                  <span className="pb-badge-big">{m.badge.big}</span>
                  {m.badge.small && <span className="pb-badge-small">{m.badge.small}</span>}
                </>
              ) : (
                <NfcIcon size={30} strokeWidth={1.9} />
              )}
            </div>

            <div className="pb-tile pb-id" style={{ "--d": "180ms" } as CSSProperties}>
              <div className="pb-id-top">
                {m.school && (
                  <span className="pb-school">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M22 10 12 5 2 10l10 5 10-5z" />
                      <path d="M6 12v5c3 2 9 2 12 0v-5" />
                    </svg>
                    {m.school}
                  </span>
                )}
                <span className="pb-dot" aria-hidden="true" />
              </div>
              <h1 className="pb-name" style={{ "--chars": m.nameChars } as CSSProperties}>
                {m.name}
              </h1>
              {m.tagline && <p className="pb-tagline">{m.tagline}</p>}
            </div>

            {m.hero && (
              <a href={m.hero.url} className="pb-tile pb-hero" style={{ "--d": "220ms" } as CSSProperties} target="_blank" rel="noopener noreferrer">
                <span className="pb-hero-chip" data-net={m.hero.type}>
                  <BrandGlyph type={m.hero.type} size={26} />
                </span>
                <span className="pb-hero-text">
                  <strong>{m.hero.label}</strong>
                  <span>{m.hero.sub}</span>
                </span>
                <span className="pb-pill">Follow</span>
              </a>
            )}

            {m.tiles.map((tile, i) =>
              tile.kind === "status" ? (
                <div key={tile.key} className="pb-tile pb-status" style={span(tile, i)}>
                  <span className="pb-status-label">
                    <span className="pb-status-dot" aria-hidden="true" />
                    CURRENTLY
                  </span>
                  <span className="pb-status-text">{m.status}</span>
                </div>
              ) : (
                <Tile key={tile.key} tile={tile} index={i} showPhoneNumbers={contact.showPhoneNumbers} />
              ),
            )}
          </div>

          {standard && standard.order.length > 0 && (
            <div className="pb-extras">
              {standard.order.map((kind) => {
                const section = standard.blocks[kind];
                return section ? <SectionBlock key={kind} section={section} /> : null;
              })}
            </div>
          )}

          <section className="pb-contact">
            <div>
              <h2>Want my contact?</h2>
              <p>{m.contactLine}</p>
            </div>
            <div className="pb-contact-row">
              <SaveButton href={meta.vcardHref} />
              <QrSheet qrHref={meta.qrHref} name={m.name || profile.fullName} url={displayUrl(meta.pageUrl)} />
            </div>
            {m.callText && (
              <div className="pb-callrow" style={{ "--cols": m.callText.text ? 2 : 1 } as CSSProperties}>
                <a href={m.callText.call}>Call</a>
                {m.callText.text && <a href={m.callText.text}>Text</a>}
              </div>
            )}
          </section>

          <Footer tagline="Always One Tap Away." showBranding={meta.showBranding} className="pb-footer" />
        </main>
      </ToastProvider>
    </ThemeScope>
  );
}
