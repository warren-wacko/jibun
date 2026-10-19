import Image from "next/image";
import type { CSSProperties } from "react";
import { displayUrl } from "../shared/model";
import type { Section } from "@/lib/page-schema";
import { dumpLayout, orgTicket, tapeItems } from "./model";

type Of<K extends Section["kind"]> = Extract<Section, { kind: K }>;

/** Interests: a strip of tape across the page with the interests printed on it, sliding past. */
function Tape({ section }: { section: Of<"interests"> }) {
  const items = tapeItems(section.items);
  return (
    <div className="pk-strip" data-block="interests" role="group" aria-label="Interests">
      <div className="pk-strip-track">
        {items.map((label, i) => (
          <span key={i} className="pk-strip-item" aria-hidden={i >= items.length / 2 ? "true" : undefined}>
            {label}
            <span className="pk-strip-dot" aria-hidden="true" />
          </span>
        ))}
      </div>
    </div>
  );
}

/** Song: a record on a kraft-paper card. The record opens the song and spins when you point at it. */
function Song({ section }: { section: Of<"song"> }) {
  return (
    <div className="pk-block pk-song-wrap" data-block="song">
      <div className="pk-song">
        <a href={section.spotifyUrl} className="pk-record" aria-label={`Listen${section.title ? ` to ${section.title}` : ""} on Spotify`} target="_blank" rel="noopener noreferrer">
          <span className="pk-record-disc">
            <span className="pk-record-label">
              <span />
            </span>
          </span>
        </a>
        <div className="pk-song-text">
          <span className="pk-song-hand">on repeat rn</span>
          <span className="pk-song-title">{section.title ?? "Listen on Spotify"}</span>
          <span className="pk-song-artist">{section.artist ?? displayUrl(section.spotifyUrl)}</span>
          <span className="pk-song-badge">TAP THE RECORD</span>
        </div>
      </div>
    </div>
  );
}

/** Photo dump: instant photos with tape, scattered and turned, each with a handwritten caption. */
function PhotoDump({ section }: { section: Of<"gallery"> }) {
  const { cards, height } = dumpLayout(section.images.length);
  return (
    <div className="pk-block pk-dump-wrap" data-block="gallery">
      <span className="pk-heading">
        <span>photo dump</span>
      </span>
      <div className="pk-dump" style={{ "--h": height } as CSSProperties}>
        {section.images.map((img, i) => (
          <figure key={`${img.url}-${i}`} className="pk-polaroid" style={{ "--x": cards[i].x, "--y": cards[i].y, "--r": `${cards[i].rot}deg`, "--tr": `${cards[i].tape}deg` } as CSSProperties}>
            <span className="pk-polaroid-tape" aria-hidden="true" />
            <span className="pk-polaroid-photo">
              <Image src={img.url} alt={img.alt} fill sizes="136px" unoptimized />
            </span>
            <figcaption>{img.alt}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/** Orgs and clubs: framed cards with the org's initials, in three alternating colours. */
function Orgs({ section }: { section: Of<"orgs"> }) {
  return (
    <div className="pk-block pk-orgs-wrap" data-block="orgs">
      <span className="pk-heading">
        <span>orgs &amp; clubs</span>
      </span>
      <div className="pk-orgs">
        {section.items.map((o, i) => {
          const t = orgTicket(o);
          return (
            <div key={`${o.name}-${i}`} className="pk-org" data-i={i % 3}>
              <div className="pk-org-art">
                <span aria-hidden="true">{t.initials}</span>
              </div>
              <div className="pk-org-text">
                <div className="pk-org-role">{t.line1}</div>
                {t.line2 && <div className="pk-org-name">{t.line2}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Video: a taped polaroid-style frame around a film strip, with a play button and the host of the link. */
function Video({ section }: { section: Of<"video"> }) {
  const host = displayUrl(section.url);
  return (
    <div className="pk-block pk-vb" data-block="video">
      <span className="pk-heading">
        <span>watch this</span>
      </span>
      <a href={section.url} className="pk-video" target="_blank" rel="noopener noreferrer" aria-label={`Watch video on ${host}`}>
        <span className="pk-video-tape pk-video-tape-l" aria-hidden="true" />
        <span className="pk-video-tape pk-video-tape-r" aria-hidden="true" />
        <span className="pk-film">
          <i className="pk-perf pk-perf-t" aria-hidden="true" />
          <i className="pk-perf pk-perf-b" aria-hidden="true" />
          <span className="pk-screen">
            <span className="pk-video-play" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" style={{ marginLeft: 4 }}>
                <path d="M7 4.5v15l12-7.5z" />
              </svg>
            </span>
          </span>
        </span>
        <span className="pk-video-foot">
          <span className="pk-video-hand">watch on</span>
          <span className="pk-ell">{host}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M7 17 17 7" />
            <path d="M8 7h9v9" />
          </svg>
        </span>
      </a>
    </div>
  );
}

/** Booking: a ruled paper ticket ("admit one") with a stub in the accent colour. */
function Booking({ section }: { section: Of<"booking"> }) {
  return (
    <div className="pk-block pk-vb" data-block="booking">
      <span className="pk-heading">
        <span>book a slot</span>
      </span>
      <div className="pk-book-fx">
        <a href={section.url} className="pk-book" target="_blank" rel="noopener noreferrer">
          <span className="pk-book-main">
            <span className="pk-book-kicker">ADMIT ONE · BOOKING</span>
            <span className="pk-book-title">BOOK A SLOT</span>
            <span className="pk-ell pk-book-host">{displayUrl(section.url)}</span>
          </span>
          <span className="pk-book-stub" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4.5" width="18" height="16.5" rx="1.5" />
              <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
              <path d="m9 15 2 2 4-4" />
            </svg>
          </span>
        </a>
      </div>
    </div>
  );
}


/** The drawing for one optional section, or null for a kind this template has no design for. */
export function SectionBlock({ section }: { section: Section }) {
  switch (section.kind) {
    case "interests":
      return <Tape section={section} />;
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
