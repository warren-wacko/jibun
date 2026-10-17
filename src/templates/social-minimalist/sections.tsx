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
