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
    default:
      return null;
  }
}
