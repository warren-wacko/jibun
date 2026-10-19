import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { ArrowUpRightIcon, LinkIcon } from "@/components/icons";
import { displayUrl } from "../shared/model";
import type { Section } from "@/lib/page-schema";
import { dumpLayout, marqueeItems, orgChip } from "./model";

type Of<K extends Section["kind"]> = Extract<Section, { kind: K }>;

/** Interests: a dark band with pills that slide past. Every third pill is in the accent colour. */
function Interests({ section }: { section: Of<"interests"> }) {
  const items = marqueeItems(section.items);
  return (
    <div className="pb-band" data-block="interests" role="group" aria-label="Interests">
      <div className="pb-band-track">
        {items.map((label, i) => (
          <span key={i} className={`pb-pill-i${i % 3 === 0 ? " is-accent" : ""}`} aria-hidden={i >= items.length / 2 ? "true" : undefined}>
            <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 1.5c.6 4.9 2.6 7 9 10.5-6.4 3.5-8.4 5.6-9 10.5-.6-4.9-2.6-7-9-10.5 6.4-3.5 8.4-5.6 9-10.5z" fill="currentColor" />
            </svg>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Song: a record that spins when you point at it, with the title and artist. The record opens the song. */
function Song({ section }: { section: Of<"song"> }) {
  return (
    <div className="pb-song" data-block="song">
      <a href={section.spotifyUrl} className="pb-record" aria-label={`Listen${section.title ? ` to ${section.title}` : ""} on Spotify`} target="_blank" rel="noopener noreferrer">
        <span className="pb-record-disc">
          <span className="pb-record-label">
            <span />
          </span>
        </span>
      </a>
      <div className="pb-song-text">
        <span className="pb-hand">on repeat</span>
        <span className="pb-song-title">{section.title ?? "Listen on Spotify"}</span>
        <span className="pb-song-artist">{section.artist ?? displayUrl(section.spotifyUrl)}</span>
        <span className="pb-song-listen">LISTEN</span>
      </div>
    </div>
  );
}

/** Photo dump: instant photos scattered on a coloured card, each turned a little, with a handwritten caption. */
function PhotoDump({ section }: { section: Of<"gallery"> }) {
  const { cards, height } = dumpLayout(section.images.length);
  return (
    <div className="pb-dump" data-block="gallery" style={{ "--h": height } as CSSProperties}>
      <div className="pb-dump-head">
        <span>photo dump</span>
        <span className="pb-hand">recent-ish</span>
      </div>
      {section.images.map((img, i) => (
        <figure key={`${img.url}-${i}`} className="pb-polaroid" style={{ "--x": cards[i].x, "--y": cards[i].y, "--r": `${cards[i].rot}deg` } as CSSProperties}>
          <span className="pb-polaroid-photo">
            <Image src={img.url} alt={img.alt} fill sizes="132px" unoptimized />
          </span>
          <figcaption>{img.alt}</figcaption>
        </figure>
      ))}
    </div>
  );
}

/** Orgs and clubs: chips with a badge, in three alternating colours. */
function Orgs({ section }: { section: Of<"orgs"> }) {
  return (
    <div className="pb-orgs" data-block="orgs">
      <span className="pb-orgs-title">orgs &amp; clubs</span>
      <div className="pb-org-list">
        {section.items.map((o, i) => {
          const chip = orgChip(o);
          return (
            <div key={`${o.name}-${i}`} className="pb-org" data-i={i % 3}>
              <span className="pb-org-badge" aria-hidden="true">
                {chip.initials}
              </span>
              <span className="pb-org-text">
                <span className="pb-org-role">{chip.line1}</span>
                {chip.line2 && <span className="pb-org-name">{chip.line2}</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const PLAY_PATH = "M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z";

function Arrow({ size, strokeWidth = 2 }: { size: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

const CalendarGlyph = ({ size, strokeWidth }: { size: number; strokeWidth: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4.5" width="18" height="16.5" rx="3" />
    <path d="M8 2.5v4M16 2.5v4M3 10h18" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01" />
  </svg>
);

/** Video: a dark tile that opens the video. We only have its link, so it shows the host, a play button and a line of handwriting. */
function Video({ section }: { section: Of<"video"> }) {
  const host = displayUrl(section.url);
  return (
    <a href={section.url} className="pb-video" data-block="video" target="_blank" rel="noopener noreferrer" aria-label={`Watch my video on ${host}`}>
      <svg className="pb-video-ghost" width="170" height="170" viewBox="0 0 24 24" aria-hidden="true">
        <path d={PLAY_PATH} fill="currentColor" />
      </svg>
      <span className="pb-video-top">
        <span className="pb-video-host">{host}</span>
        <Arrow size={18} />
      </span>
      <span className="pb-video-bottom">
        <span className="pb-video-words">
          <span className="pb-hand pb-video-hand">press play</span>
          <span className="pb-video-title">watch my video</span>
        </span>
        <span className="pb-video-play" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24">
            <path d={PLAY_PATH} fill="currentColor" />
          </svg>
        </span>
      </span>
    </a>
  );
}

/** Booking: a big accent tile ("book a time" and the host) with two small tiles beside it. */
function Booking({ section }: { section: Of<"booking"> }) {
  return (
    <a href={section.url} className="pb-book" data-block="booking" target="_blank" rel="noopener noreferrer">
      <span className="pb-book-main">
        <span className="pb-book-label">
          <CalendarGlyph size={14} strokeWidth={1.9} />
          BOOKING
        </span>
        <span className="pb-book-words">
          <span className="pb-book-title">book a time</span>
          <span className="pb-book-host">{displayUrl(section.url)}</span>
        </span>
      </span>
      <span className="pb-book-icon pb-book-icon-hero">
        <CalendarGlyph size={24} strokeWidth={1.9} />
      </span>
      <span className="pb-book-icon pb-book-icon-plain">
        <Arrow size={22} />
      </span>
    </a>
  );
}


/** Résumé: a tile with the title, a handwritten note and a button that downloads the file. */
function Resume({ section }: { section: Of<"resume"> }) {
  return (
    <div className="pb-resume" data-block="resume">
      <div className="pb-resume-head">
        <span className="pb-orgs-title">my résumé</span>
        <span className="pb-hand pb-resume-note">grab a copy</span>
      </div>
      <a href={section.fileUrl} className="pb-resume-btn" download target="_blank" rel="noopener noreferrer">
        <span className="pb-resume-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
        </span>
        <span className="pb-resume-label">{section.label ?? "Résumé / CV"}</span>
      </a>
    </div>
  );
}

/** The 4-column tile grid the stats and portfolio sections use: a dark title tile, then tiles two columns wide (the last one full width when it would stand alone). */
function GridTitle({ label, title, note }: { label: string; title: string; note: string }) {
  return (
    <div className="pb-grid-title">
      <div className="pb-grid-title-top">
        <span className="pb-grid-label">{label}</span>
        <span className="pb-grid-dot" aria-hidden="true" />
      </div>
      <div className="pb-grid-title-words">
        <span className="pb-grid-h">{title}</span>
        <span className="pb-hand pb-grid-note">{note}</span>
      </div>
    </div>
  );
}

/** Stats: a title tile and one tile per stat, the value big and the label in mono underneath. */
function Stats({ section }: { section: Of<"stats"> }) {
  const items = section.items;
  const lonely = items.length % 2 === 0;
  return (
    <div className="pb-grid" data-block="stats">
      <GridTitle label="STATS" title="quick stats" note="the short version" />
      {items.map((s, i) => (
        <div key={`${s.label}-${i}`} className={`pb-stat${lonely && i === items.length - 1 ? " is-wide" : ""}`} data-i={i % 3}>
          <span className={`pb-stat-value${s.value.length > 12 ? " is-long" : ""}`}>{s.value}</span>
          <span className="pb-stat-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Portfolio: a title tile and one tile per project, with the thumbnail on top when there is one. */
function Portfolio({ section }: { section: Of<"portfolio"> }) {
  const items = section.items;
  const lonely = items.length % 2 === 0;
  return (
    <div className="pb-grid" data-block="portfolio">
      <GridTitle label="PORTFOLIO" title="things I made" note="tap to open" />
      {items.map((p, i) => {
        const wide = lonely && i === items.length - 1;
        return (
          <a key={`${p.url}-${i}`} href={p.url} className={`pb-work${wide ? " is-wide" : ""}`} target="_blank" rel="noopener noreferrer">
            {p.thumbUrl ? (
              <span className="pb-work-thumb">
                <Image src={p.thumbUrl} alt="" fill sizes="(max-width: 430px) 50vw, 215px" unoptimized />
                <span className="pb-work-go" aria-hidden="true">
                  <ArrowUpRightIcon size={15} strokeWidth={2} />
                </span>
              </span>
            ) : null}
            <span className="pb-work-body">
              {!p.thumbUrl && (
                <span className="pb-work-top" aria-hidden="true">
                  <span className="pb-work-chip">
                    <LinkIcon size={18} strokeWidth={1.9} />
                  </span>
                  <ArrowUpRightIcon size={18} strokeWidth={2} />
                </span>
              )}
              <span className="pb-work-title">{p.title}</span>
              {p.desc && <span className="pb-work-desc">{p.desc}</span>}
            </span>
          </a>
        );
      })}
    </div>
  );
}

/** A tile with a title, a handwritten note on the right and the section's content below. */
function TileCard({ block, title, note, gap, children }: { block: string; title: string; note: string; gap: number; children: ReactNode }) {
  return (
    <div className="pb-card" data-block={block} style={{ "--gap": `${gap}px` } as CSSProperties}>
      <div className="pb-card-head">
        <span className="pb-orgs-title">{title}</span>
        <span className="pb-hand pb-card-note">{note}</span>
      </div>
      {children}
    </div>
  );
}

/** Services: a list inside one tile, the price in a soft accent pill on the right where there is one. */
function Services({ section }: { section: Of<"services"> }) {
  return (
    <TileCard block="services" title="services" note="just ask" gap={8}>
      <ul className="pb-services">
        {section.items.map((s, i) => (
          <li key={`${s.name}-${i}`}>
            <span className="pb-service-name">{s.name}</span>
            {s.price && <span className="pb-service-price">{s.price}</span>}
          </li>
        ))}
      </ul>
    </TileCard>
  );
}

/** Experience: a timeline inside one tile, the years in a small chip. The latest entry has the filled dot. */
function Experience({ section }: { section: Of<"experience"> }) {
  const items = section.items;
  return (
    <TileCard block="experience" title="experience" note="so far" gap={16}>
      <ol className="pb-exp">
        {items.map((x, i) => (
          <li key={`${x.role}-${i}`} className={i === 0 ? "is-current" : undefined}>
            <span className="pb-exp-rail" aria-hidden="true">
              <span className="pb-exp-dot" />
              {i < items.length - 1 && <span className="pb-exp-line" />}
            </span>
            <span className="pb-exp-body">
              <span className="pb-exp-years">{x.years}</span>
              <span className="pb-exp-role">{x.role}</span>
              <span className="pb-exp-org">{x.org}</span>
            </span>
          </li>
        ))}
      </ol>
    </TileCard>
  );
}

/** Skills: round tags in one tile, every fourth one in the accent, each with a small spark. */
function Skills({ section }: { section: Of<"skills"> }) {
  return (
    <TileCard block="skills" title="skills" note="always learning" gap={14}>
      <ul className="pb-skills">
        {section.items.map((k, i) => (
          <li key={`${k}-${i}`} className={i % 4 === 0 ? "is-on" : undefined}>
            <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 1.5c.6 4.9 2.6 7 9 10.5-6.4 3.5-8.4 5.6-9 10.5-.6-4.9-2.6-7-9-10.5 6.4-3.5 8.4-5.6 9-10.5z" fill="currentColor" />
            </svg>
            <span>{k}</span>
          </li>
        ))}
      </ul>
    </TileCard>
  );
}

/** The drawing for one optional section, or null for a kind this template has no design for. */
export function SectionBlock({ section }: { section: Section }) {
  switch (section.kind) {
    case "interests":
      return <Interests section={section} />;
    case "song":
      return <Song section={section} />;
    case "gallery":
      return <PhotoDump section={section} />;
    case "orgs":
      return <Orgs section={section} />;
    case "resume":
      return <Resume section={section} />;
    case "stats":
      return <Stats section={section} />;
    case "portfolio":
      return <Portfolio section={section} />;
    case "services":
      return <Services section={section} />;
    case "experience":
      return <Experience section={section} />;
    case "skills":
      return <Skills section={section} />;
    case "video":
      return <Video section={section} />;
    case "booking":
      return <Booking section={section} />;
    default:
      return null;
  }
}
