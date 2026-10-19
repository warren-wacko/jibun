import Image from "next/image";
import type { CSSProperties } from "react";
import { ArrowUpRightIcon, FileDownloadIcon } from "@/components/icons";
import type { Section } from "@/lib/page-schema";
import { displayUrl, orgInitials, songView } from "../shared/model";

type Of<K extends Section["kind"]> = Extract<Section, { kind: K }>;

/** Gallery: square photos, three across. */
function Gallery({ section }: { section: Of<"gallery"> }) {
  return (
    <ul className="pco-gallery">
      {section.images.map((img, i) => (
        <li key={`${img.url}-${i}`}>
          <Image src={img.url} alt={img.alt} fill sizes="120px" unoptimized />
        </li>
      ))}
    </ul>
  );
}

/** Portfolio: a link per project with a small thumbnail when there is one. */
function Portfolio({ section }: { section: Of<"portfolio"> }) {
  return (
    <div className="pco-works">
      {section.items.map((p, i) => (
        <a key={`${p.url}-${i}`} href={p.url} className="pco-work" target="_blank" rel="noopener noreferrer">
          {p.thumbUrl && (
            <span className="pco-work-thumb">
              <Image src={p.thumbUrl} alt="" width={48} height={48} unoptimized />
            </span>
          )}
          <span className="pco-work-text">
            <span className="pco-work-title">{p.title}</span>
            {p.desc && <span className="pco-work-desc">{p.desc}</span>}
          </span>
          <ArrowUpRightIcon size={16} strokeWidth={1.9} className="pco-work-arrow" />
        </a>
      ))}
    </div>
  );
}

/** Services: a card per service with a big number and the price as a pill. */
function Services({ section }: { section: Of<"services"> }) {
  return (
    <ul className="pco-services">
      {section.items.map((s, i) => (
        <li key={`${s.name}-${i}`}>
          {/* a ghost numeral: drawn by CSS from data-n, so it is decoration and not text */}
          <span className="pco-service-n" data-n={String(i + 1).padStart(2, "0")} aria-hidden="true" />
          <span className="pco-service-body">
            <span className="pco-service-name">{s.name}</span>
            {s.price && <span className="pco-price">{s.price}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Résumé: one row that downloads the file. */
function Resume({ section }: { section: Of<"resume"> }) {
  return (
    <a href={section.fileUrl} className="pco-resume" target="_blank" rel="noopener noreferrer" download>
      <FileDownloadIcon size={20} strokeWidth={1.8} />
      <span className="pco-resume-text">
        <span className="pco-resume-title">{section.label ?? "Download résumé"}</span>
        <span className="pco-resume-sub">PDF</span>
      </span>
      <ArrowUpRightIcon size={16} strokeWidth={1.9} />
    </a>
  );
}

/** Experience: a timeline, the latest entry first with the filled dot. */
function Experience({ section }: { section: Of<"experience"> }) {
  return (
    <ol className="pco-timeline">
      {section.items.map((x, i) => (
        <li key={`${x.role}-${i}`} className={i === 0 ? "is-current" : undefined}>
          <span className="pco-time-rail" aria-hidden="true">
            <span className="pco-time-dot" />
          </span>
          <span className="pco-time-body">
            <span className="pco-time-years">{x.years}</span>
            <span className="pco-time-role">{x.role}</span>
            <span className="pco-time-org">{x.org}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Skills: small rounded tags. */
function Skills({ section }: { section: Of<"skills"> }) {
  return (
    <ul className="pco-tags">
      {section.items.map((k, i) => (
        <li key={`${k}-${i}`}>{k}</li>
      ))}
    </ul>
  );
}

/** Stats: up to three across with hairlines between, more wrap onto further rows. */
function Stats({ section }: { section: Of<"stats"> }) {
  return (
    <dl className="pco-stats" style={{ "--cols": Math.min(section.items.length, 3) } as CSSProperties}>
      {section.items.map((s, i) => (
        <div key={`${s.label}-${i}`} className="pco-stat">
          <dt>{s.label}</dt>
          <dd>{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The drawing for one optional section, or null for a kind this template has no design for. */
/** Video: a deep brand-coloured card that opens the video. We only have its link, so it shows a play button and the host. */
function Video({ section }: { section: Of<"video"> }) {
  const host = displayUrl(section.url);
  return (
    <a href={section.url} className="pco-video" target="_blank" rel="noopener noreferrer" aria-label={`Watch video on ${host}`}>
      <span className="pco-video-glow" aria-hidden="true" />
      <span className="pco-video-ghost" aria-hidden="true">
        <svg width="170" height="170" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="3" />
          <path d="m10 9 5 3-5 3z" />
        </svg>
      </span>
      <span className="pco-video-kicker">VIDEO</span>
      <span className="pco-video-play" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 3 }}>
          <path d="M7 4.5v15l12.5-7.5z" />
        </svg>
      </span>
      <span className="pco-video-foot">
        <span className="pco-video-text">
          <span className="pco-video-title">Watch the video</span>
          <span className="pco-video-host">{host}</span>
        </span>
        <span className="pco-video-go" aria-hidden="true">
          <ArrowUpRightIcon size={16} strokeWidth={1.9} />
        </span>
      </span>
    </a>
  );
}

/** Booking: a card with an icon, a line of help, the host of the link and a brand-coloured button. */
function Booking({ section }: { section: Of<"booking"> }) {
  return (
    <div className="pco-booking">
      <span className="pco-booking-ghost" aria-hidden="true">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </span>
      <div className="pco-booking-row">
        <span className="pco-booking-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" />
          </svg>
        </span>
        <span className="pco-booking-text">
          <span className="pco-booking-kicker">BOOKING</span>
          <span className="pco-booking-title">Schedule a call or visit</span>
          <span className="pco-booking-host">{displayUrl(section.url)}</span>
        </span>
      </div>
      <a href={section.url} className="pco-booking-go" target="_blank" rel="noopener noreferrer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        Open booking page
        <ArrowUpRightIcon size={16} strokeWidth={1.9} />
      </a>
    </div>
  );
}

/** Interests: small tiles with a brand dot, wrapping inside one card. */
function Interests({ section }: { section: Of<"interests"> }) {
  return (
    <ul className="pco-interests">
      {section.items.map((x, i) => (
        <li key={`${x}-${i}`}>
          <span className="pco-interest-dot" aria-hidden="true" />
          {x}
        </li>
      ))}
    </ul>
  );
}

/** Organizations: one card, a row per org with a rounded square of initials, the name and the role when there is one. */
function Orgs({ section }: { section: Of<"orgs"> }) {
  return (
    <ul className="pco-orgs">
      {section.items.map((o, i) => (
        <li key={`${o.name}-${i}`}>
          <span className="pco-org-badge" aria-hidden="true">
            {orgInitials(o.name)}
          </span>
          <span className="pco-org-text">
            <span className="pco-org-name">{o.name}</span>
            {o.role && <span className="pco-org-role">{o.role}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Favourite song: a card with a brand tile and a ghost mark behind it, opening the song on Spotify. */
function Song({ section }: { section: Of<"song"> }) {
  const v = songView(section);
  return (
    <a href={section.spotifyUrl} className="pco-song" aria-label={v.aria} target="_blank" rel="noopener noreferrer">
      <span className="pco-song-ghost" aria-hidden="true">
        <SpotifyRings size={120} strokeWidth={1.4} />
      </span>
      <span className="pco-song-tile" aria-hidden="true">
        <SpotifyRings size={24} strokeWidth={1.9} />
      </span>
      <span className="pco-song-text">
        <span className="pco-song-kicker">SPOTIFY</span>
        <span className="pco-song-title">{v.heading}</span>
        {v.artist && <span className="pco-song-artist">{v.artist}</span>}
      </span>
      <span className="pco-song-go" aria-hidden="true">
        <ArrowUpRightIcon size={16} strokeWidth={1.9} />
      </span>
    </a>
  );
}

function SpotifyRings({ size, strokeWidth }: { size: number; strokeWidth: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M7 9.4c3.6-1.1 7.6-.7 10.6 1.1M7.6 12.8c2.9-.8 6.1-.5 8.6 1M8.2 16c2.2-.6 4.6-.4 6.5.7" />
    </svg>
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

/** The kinds drawn without a surrounding box (they are made of cards or tiles already). */
export const BARE_KINDS: ReadonlySet<string> = new Set(["services", "video", "booking", "interests", "orgs", "song"]);
