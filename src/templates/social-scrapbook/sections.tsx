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
    default:
      return null;
  }
}
