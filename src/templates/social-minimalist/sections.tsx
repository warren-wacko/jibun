import Image from "next/image";
import type { CSSProperties } from "react";
import { displayUrl } from "../shared/model";
import type { Section } from "@/lib/page-schema";
import { dumpLayout, interestLoop, orgPill } from "./model";

type Of<K extends Section["kind"]> = Extract<Section, { kind: K }>;

/** Interests: big italic serif words between two hairlines, sliding past, with an accent dot after each. */
function Interests({ section }: { section: Of<"interests"> }) {
  const items = interestLoop(section.items);
  return (
    <div className="mn-ticker" data-block="interests" role="group" aria-label="Interests">
      <div className="mn-ticker-track">
        {items.map((label, i) => (
          <span key={i} className={`mn-ticker-item${i % 2 ? " is-dim" : ""}`} aria-hidden={i >= items.length / 2 ? "true" : undefined}>
            {label}
            <span className="mn-ticker-dot" aria-hidden="true" />
          </span>
        ))}
      </div>
    </div>
  );
}

/** Song: a record that opens the song and spins when you point at it, with the title and artist. */
function Song({ section }: { section: Of<"song"> }) {
  return (
    <div className="mn-block mn-song-wrap" data-block="song">
      <span className="mn-label">On repeat</span>
      <div className="mn-song">
        <a href={section.spotifyUrl} className="mn-record" aria-label={`Listen${section.title ? ` to ${section.title}` : ""} on Spotify`} target="_blank" rel="noopener noreferrer">
          <span className="mn-record-disc">
            <span className="mn-record-label">
              <span />
            </span>
          </span>
        </a>
        <div className="mn-song-text">
          <span className="mn-song-title">{section.title ?? "Listen on Spotify"}</span>
          <span className="mn-song-artist">{section.artist ?? displayUrl(section.spotifyUrl)}</span>
        </div>
      </div>
    </div>
  );
}

/** Photo dump: small rounded cards, scattered and turned a little, with a mono caption. */
function PhotoDump({ section }: { section: Of<"gallery"> }) {
  const { cards, height } = dumpLayout(section.images.length);
  return (
    <div className="mn-block mn-dump-wrap" data-block="gallery">
      <div className="mn-dump-head">
        <span className="mn-label">Photo dump</span>
        <span className="mn-serif-note">recent-ish</span>
      </div>
      <div className="mn-dump" style={{ "--h": height } as CSSProperties}>
        {section.images.map((img, i) => (
          <figure key={`${img.url}-${i}`} className="mn-polaroid" style={{ "--x": cards[i].x, "--y": cards[i].y, "--r": `${cards[i].rot}deg` } as CSSProperties}>
            <span className="mn-polaroid-photo">
              <Image src={img.url} alt={img.alt} fill sizes="134px" unoptimized />
            </span>
            <figcaption>{img.alt}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/** Orgs and clubs: pills with a round badge, in three alternating colour styles. */
function Orgs({ section }: { section: Of<"orgs"> }) {
  return (
    <div className="mn-block mn-orgs-wrap" data-block="orgs">
      <span className="mn-label">Orgs &amp; clubs</span>
      <div className="mn-orgs">
        {section.items.map((o, i) => {
          const p = orgPill(o);
          return (
            <div key={`${o.name}-${i}`} className="mn-org" data-i={i % 3}>
              <span className="mn-org-badge" aria-hidden="true">
                {p.initials}
              </span>
              <span className="mn-org-text">
                {p.main}
                {p.rest && <span className="mn-org-rest"> · {p.rest}</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Video: a rounded tile with a big accent play button, a serif title and the host of the link. */
function Video({ section }: { section: Of<"video"> }) {
  const host = displayUrl(section.url);
  return (
    <div className="mn-block" data-block="video">
      <div className="mn-dump-head mn-head-gap">
        <span className="mn-label">Video</span>
        <span className="mn-serif-note">press play</span>
      </div>
      <a href={section.url} className="mn-video" target="_blank" rel="noopener noreferrer" aria-label={`Watch the video on ${host}`}>
        <span className="mn-video-play" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5.2v13.6l11-6.8z" />
          </svg>
        </span>
        <span className="mn-video-text">
          <span className="mn-video-title">
            Watch the <em>video</em>
          </span>
          <span className="mn-one mn-video-host">{host}</span>
        </span>
        <svg className="mn-video-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7 17 17 7M8 7h9v9" />
        </svg>
      </a>
    </div>
  );
}

/** Booking: a black pill with the title and host, and an accent circle with a calendar. */
function Booking({ section }: { section: Of<"booking"> }) {
  return (
    <div className="mn-block" data-block="booking">
      <div className="mn-dump-head mn-head-gap">
        <span className="mn-label">Booking</span>
        <span className="mn-serif-note">let&apos;s meet</span>
      </div>
      <a href={section.url} className="mn-book" target="_blank" rel="noopener noreferrer">
        <span className="mn-book-text">
          <span className="mn-book-title">Book a time with me</span>
          <span className="mn-one mn-book-host">{displayUrl(section.url)}</span>
        </span>
        <span className="mn-book-chip" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
            <path d="M16 3v4M8 3v4M3.5 10.5h17" />
          </svg>
        </span>
      </a>
    </div>
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
