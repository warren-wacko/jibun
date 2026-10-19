import Image from "next/image";
import type { CSSProperties } from "react";
import { ArrowUpRightIcon, LinkIcon } from "@/components/icons";
import type { Section } from "@/lib/page-schema";
import { SpotifyMark } from "../shared/SpotifyMark";
import { displayUrl, orgInitials, songView } from "../shared/model";

type Of<K extends Section["kind"]> = Extract<Section, { kind: K }>;

/** Gallery: photos in a row you can swipe. The description sits on the photo. */
export function Gallery({ section }: { section: Of<"gallery"> }) {
  return (
    <div className="pc-gallery">
      {section.images.map((img, i) => (
        <figure key={`${img.url}-${i}`} className="pc-gallery-item">
          <Image src={img.url} alt={img.alt} fill sizes="220px" unoptimized />
          <figcaption>{img.alt}</figcaption>
        </figure>
      ))}
    </div>
  );
}

/** Portfolio: a link per project, with a thumbnail when there is one. */
export function Portfolio({ section }: { section: Of<"portfolio"> }) {
  return (
    <div className="pc-list">
      {section.items.map((p, i) => (
        <a key={`${p.url}-${i}`} href={p.url} className="pc-work" target="_blank" rel="noopener noreferrer">
          {p.thumbUrl && (
            <span className="pc-work-thumb">
              <Image src={p.thumbUrl} alt="" width={64} height={64} unoptimized />
            </span>
          )}
          <span className="pc-work-text">
            <span className="pc-item-title">{p.title}</span>
            {p.desc && <span className="pc-item-desc">{p.desc}</span>}
          </span>
          <ArrowUpRightIcon size={18} className="pc-row-arrow" />
        </a>
      ))}
    </div>
  );
}

/** Services: one list with a price on the right where there is one. */
export function Services({ section }: { section: Of<"services"> }) {
  return (
    <ul className="pc-services">
      {section.items.map((s, i) => (
        <li key={`${s.name}-${i}`}>
          <span className="pc-item-title">{s.name}</span>
          {s.price && <span className="pc-price">{s.price}</span>}
        </li>
      ))}
    </ul>
  );
}

/** Résumé: a card with a PDF tag and a download button. */
export function Resume({ section }: { section: Of<"resume"> }) {
  return (
    <div className="pc-resume">
      <span className="pc-resume-tag" aria-hidden="true">
        PDF
      </span>
      <span className="pc-work-text">
        <span className="pc-item-title">{section.label ?? "Résumé / CV"}</span>
        <span className="pc-resume-sub">PDF</span>
      </span>
      <a href={section.fileUrl} className="pc-download" target="_blank" rel="noopener noreferrer" download>
        <LinkIcon size={16} />
        Download
      </a>
    </div>
  );
}

/** Experience: a timeline. The first (latest) entry has the filled dot. */
export function Experience({ section }: { section: Of<"experience"> }) {
  return (
    <ol className="pc-timeline">
      {section.items.map((x, i) => (
        <li key={`${x.role}-${i}`} className={i === 0 ? "is-current" : undefined}>
          <span className="pc-time-rail" aria-hidden="true">
            <span className="pc-time-dot" />
          </span>
          <span className="pc-time-body">
            <span className="pc-time-years">{x.years}</span>
            <span className="pc-time-role">{x.role}</span>
            <span className="pc-item-desc">{x.org}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Skills: chips that wrap. */
export function Skills({ section }: { section: Of<"skills"> }) {
  return (
    <ul className="pc-chips">
      {section.items.map((k, i) => (
        <li key={`${k}-${i}`}>{k}</li>
      ))}
    </ul>
  );
}

/** Stats: up to three across, more wrap onto further rows. */
export function Stats({ section }: { section: Of<"stats"> }) {
  return (
    <dl className="pc-stats" style={{ "--cols": Math.min(section.items.length, 3) } as CSSProperties}>
      {section.items.map((s, i) => (
        <div key={`${s.label}-${i}`} className="pc-stat">
          <dt>{s.label}</dt>
          <dd>{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The drawing for one optional section, or null for a kind this template has no design for. */
/** Video: a card that opens the video. We only have its link, so the "screen" is a pattern and the host is shown. */
export function Video({ section }: { section: Of<"video"> }) {
  const host = displayUrl(section.url);
  return (
    <a href={section.url} className="pc-video" target="_blank" rel="noopener noreferrer" aria-label={`Watch video on ${host}`}>
      <span className="pc-video-screen">
        <span className="pc-video-play">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" style={{ marginLeft: 3 }} aria-hidden="true">
            <path d="M7 4.5v15l12-7.5z" />
          </svg>
        </span>
      </span>
      <span className="pc-video-foot">
        <span className="pc-video-text">
          <span className="pc-video-title">Watch the video</span>
          <span className="pc-video-host">{host}</span>
        </span>
        <ArrowUpRightIcon size={18} />
      </span>
    </a>
  );
}

/** Booking: a card with a Book button that opens the booking page. We only have its link. */
export function Booking({ section }: { section: Of<"booking"> }) {
  return (
    <a href={section.url} className="pc-booking" target="_blank" rel="noopener noreferrer">
      <span className="pc-booking-icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4.5" width="18" height="16.5" rx="2" />
          <path d="M16 2.5v4M8 2.5v4M3 10h18" />
          <path d="m9 15.5 2 2 4-4" />
        </svg>
      </span>
      <span className="pc-video-text">
        <span className="pc-booking-title">Book a meeting</span>
        <span className="pc-video-host">{displayUrl(section.url)}</span>
      </span>
      <span className="pc-booking-go">
        Book
        <ArrowUpRightIcon size={16} strokeWidth={2} />
      </span>
    </a>
  );
}

/** Interests: one card with the interests wrapping inside it, each after a small accent dot. */
export function Interests({ section }: { section: Of<"interests"> }) {
  return (
    <ul className="pc-interests">
      {section.items.map((x, i) => (
        <li key={`${x}-${i}`}>
          <span className="pc-interest-dot" aria-hidden="true" />
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );
}

/** Organizations: one card, a row per org with an initials badge, the name and the role when there is one. */
export function Orgs({ section }: { section: Of<"orgs"> }) {
  return (
    <ul className="pc-orgs">
      {section.items.map((o, i) => (
        <li key={`${o.name}-${i}`}>
          <span className="pc-org-badge" aria-hidden="true">
            {orgInitials(o.name)}
          </span>
          <span className="pc-work-text">
            <span className="pc-item-title">{o.name}</span>
            {o.role && <span className="pc-org-role">{o.role}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Favorite song: a card that opens the song on Spotify, with the title and artist (or the host when there is no artist). */
export function Song({ section }: { section: Of<"song"> }) {
  const v = songView(section);
  return (
    <a href={section.spotifyUrl} className="pc-song" aria-label={v.aria} target="_blank" rel="noopener noreferrer">
      <span className="pc-song-mark">
        <SpotifyMark />
      </span>
      <span className="pc-work-text">
        <span className="pc-item-title">{v.heading}</span>
        {v.artist ? <span className="pc-org-role">{v.artist}</span> : <span className="pc-video-host">{v.host}</span>}
      </span>
      <ArrowUpRightIcon size={18} className="pc-row-arrow" />
    </a>
  );
}

export function SectionBody({ section }: { section: Section }) {
  switch (section.kind) {
    case "gallery":
      return <Gallery section={section} />;
    case "portfolio":
      return <Portfolio section={section} />;
    case "services":
      return <Services section={section} />;
    case "resume":
      return <Resume section={section} />;
    case "experience":
      return <Experience section={section} />;
    case "skills":
      return <Skills section={section} />;
    case "stats":
      return <Stats section={section} />;
    case "video":
      return <Video section={section} />;
    case "booking":
      return <Booking section={section} />;
    case "interests":
      return <Interests section={section} />;
    case "orgs":
      return <Orgs section={section} />;
    case "song":
      return <Song section={section} />;
    default:
      return null;
  }
}
