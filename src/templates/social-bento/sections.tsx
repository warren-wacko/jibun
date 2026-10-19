import Image from "next/image";
import type { CSSProperties } from "react";
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
    case "video":
      return <Video section={section} />;
    case "booking":
      return <Booking section={section} />;
    default:
      return null;
  }
}
