import Image from "next/image";
import { Fragment, type CSSProperties, type ReactNode } from "react";
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
import { findFontPair } from "../font-pairs";
import { displayUrl } from "../shared/model";
import type { TemplateProps } from "../types";
import { FONT_CLASSES } from "./fonts";
import { BottomBar, CopyEmail, CoverShare, CoverThemeToggle, ToastProvider } from "./interactive";
import { BLOCK_TITLES, buildBlocks, buildMagazineModel, type TouchRow } from "./model";
import { SectionBody } from "./sections";
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

/**
 * A block's heading. The Starter design is a plain label. The Standard design numbers its blocks like magazine
 * pages ("P. 01"), counting the blocks that are drawn, in the order they are drawn.
 */
function Head({ title, page }: { title: string; page?: number }) {
  if (page === undefined) return <span className="pm-label">{title}</span>;
  return (
    <div className="pm-block-head">
      <span>{title}</span>
      <span>P. {String(page).padStart(2, "0")}</span>
    </div>
  );
}

/** Professional / contact-first template: full-bleed cover photo, giant headline, big action rows, sticky Save Contact bar. */
export function ProMagazineTemplate({ data, theme, meta }: TemplateProps) {
  const { profile, style } = data;
  const design = meta.design ?? "starter";
  const standard = design === "standard";
  const fontPair = standard && style.fontPair && findFontPair("pro-magazine", style.fontPair) ? style.fontPair : undefined;
  const m = buildMagazineModel(data, fontPair);
  const listCount = Number(m.profiles.length > 0) + Number(m.messaging.length > 0);
  const { order, sections } = buildBlocks(data, design);

  // Which blocks have something to show, so the Standard design can number the pages that are really drawn.
  const present: Record<string, boolean> = {
    about: Boolean(profile.bio),
    contents: m.rows.length > 0,
    connect: Boolean(m.featured || m.email),
    socials: listCount > 0,
    ...Object.fromEntries(Object.keys(sections).map((k) => [k, true])),
  };
  const drawn = order.filter((t) => present[t]);
  const page = (token: string) => (standard ? drawn.indexOf(token) + 1 : undefined);
  const first = (token: string) => (drawn[0] === token ? " pm-first" : "");

  const blocks: Record<string, ReactNode> = {
    about: present.about && (
      <section className={`pm-brief${first("about")}`} data-block="about">
        <Head title={BLOCK_TITLES.about} page={page("about")} />
        <p className="pm-bio">{profile.bio}</p>
      </section>
    ),
    contents: present.contents && (
      <section className={`pm-section${first("contents")}`} data-block="contents">
        {standard && <Head title={BLOCK_TITLES.contents} page={page("contents")} />}
        <div className="pm-touch">
        <div className="pm-touch-head">
          {!standard && <span className="pm-label">{BLOCK_TITLES.contents}</span>}
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
        </div>
      </section>
    ),
    connect: present.connect && (
      <section className={`pm-section pm-connect${first("connect")}`} data-block="connect">
        <Head title={BLOCK_TITLES.connect} page={page("connect")} />
        <div className="pm-stack">
          {m.featured && (
            <a href={m.featured.url} className="pm-link-row pm-link-row-featured" target="_blank" rel="noopener noreferrer">
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
        </div>
      </section>
    ),
    socials: present.socials && (
      <section className={`pm-socials${first("socials")}`} data-block="socials">
        {standard && <Head title={BLOCK_TITLES.socials} page={page("socials")} />}
        <div className="pm-lists" style={{ "--cols": listCount } as CSSProperties}>
          {m.profiles.length > 0 && <LinkList title="Profiles to view" links={m.profiles} />}
          {m.messaging.length > 0 && <LinkList title="Ways to message" links={m.messaging} />}
        </div>
      </section>
    ),
  };
  for (const [kind, section] of Object.entries(sections)) {
    if (!section) continue;
    blocks[kind] = (
      <section className={`pm-section pm-extra${first(kind)}`} data-block={kind}>
        <Head title={BLOCK_TITLES[kind] ?? kind} page={page(kind)} />
        <SectionBody section={section} />
      </section>
    );
  }

  return (
    <ThemeScope
      theme={theme}
      accent={style.accent}
      template="pro-magazine"
      className={FONT_CLASSES}
      attrs={{ "data-design": design, "data-font-pair": fontPair }}
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

          {order.map((token) => (
            <Fragment key={token}>{blocks[token]}</Fragment>
          ))}

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
