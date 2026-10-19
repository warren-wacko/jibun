import Image from "next/image";
import { Fragment, type CSSProperties } from "react";
import { ArrowUpRightIcon, LinkIcon } from "@/components/icons";
import type { Section } from "@/lib/page-schema";
import { SpotifyMark } from "../shared/SpotifyMark";
import { displayUrl, orgInitials, songView } from "../shared/model";

type Of<K extends Section["kind"]> = Extract<Section, { kind: K }>;

/** Gallery: tall photos in a swipeable row, with a numbered caption under each. */
function Gallery({ section }: { section: Of<"gallery"> }) {
  return (
    <div className="pm-gallery">
      {section.images.map((img, i) => (
        <figure key={`${img.url}-${i}`} className="pm-gallery-item">
          <span className="pm-gallery-photo">
            <Image src={img.url} alt={img.alt} fill sizes="210px" unoptimized />
          </span>
          <figcaption>
            FIG. {i + 1} — {img.alt}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

/** Portfolio ("Selected work"): ruled rows with a square thumbnail when there is one. */
function Portfolio({ section }: { section: Of<"portfolio"> }) {
  return (
    <div className="pm-ruled">
      {section.items.map((p, i) => (
        <a key={`${p.url}-${i}`} href={p.url} className="pm-work" target="_blank" rel="noopener noreferrer">
          {p.thumbUrl && (
            <span className="pm-work-thumb">
              <Image src={p.thumbUrl} alt="" width={72} height={72} unoptimized />
            </span>
          )}
          <span className="pm-work-text">
            <span className="pm-head-text">{p.title}</span>
            {p.desc && <span className="pm-item-desc">{p.desc}</span>}
          </span>
          <ArrowUpRightIcon size={18} className="pm-link-arrow" />
        </a>
      ))}
    </div>
  );
}

/** Services: ruled rows with the price on the right. */
function Services({ section }: { section: Of<"services"> }) {
  return (
    <div className="pm-ruled">
      {section.items.map((s, i) => (
        <div key={`${s.name}-${i}`} className="pm-service">
          <span className="pm-head-text">{s.name}</span>
          {s.price && <span className="pm-price">{s.price}</span>}
        </div>
      ))}
    </div>
  );
}

/** Résumé: a solid block with a download button. */
function Resume({ section }: { section: Of<"resume"> }) {
  return (
    <div className="pm-resume">
      <span className="pm-resume-kicker">THE FULL STORY</span>
      <span className="pm-resume-title">{section.label ?? "Read my résumé"}</span>
      <a href={section.fileUrl} className="pm-download" target="_blank" rel="noopener noreferrer" download>
        <LinkIcon size={18} />
        Download PDF
      </a>
    </div>
  );
}

/** Experience: the years in big type on the left, the role and the place on the right. */
function Experience({ section }: { section: Of<"experience"> }) {
  return (
    <div className="pm-ruled">
      {section.items.map((x, i) => (
        <div key={`${x.role}-${i}`} className={`pm-exp${i === 0 ? " is-current" : ""}`}>
          <span className="pm-exp-years">{x.years}</span>
          <span className="pm-exp-body">
            <span className="pm-exp-role">{x.role}</span>
            <span className="pm-exp-org">{x.org}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/** Skills: square outlined tags. */
function Skills({ section }: { section: Of<"skills"> }) {
  return (
    <ul className="pm-tags">
      {section.items.map((k, i) => (
        <li key={`${k}-${i}`}>{k}</li>
      ))}
    </ul>
  );
}

/** Stats ("By the numbers"): big figures in up to three columns, more wrap onto new rows. */
function Stats({ section }: { section: Of<"stats"> }) {
  return (
    <dl className="pm-stats" style={{ "--cols": Math.min(section.items.length, 3) } as CSSProperties}>
      {section.items.map((s, i) => (
        <div key={`${s.label}-${i}`} className="pm-stat">
          <dt>{s.label}</dt>
          <dd>{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The drawing for one optional section, or null for a kind this template has no design for. */
/** Interests: one big line of words, each separated by an accent slash. Short ones stay in one piece, long ones may wrap. */
function Interests({ section }: { section: Of<"interests"> }) {
  const items = section.items;
  return (
    <p className="pm-interests">
      {items.map((x, i) => (
        <Fragment key={`${x}-${i}`}>
          <span className={x.length <= 24 ? "pm-nowrap" : undefined}>{x}</span>
          {i < items.length - 1 && (
            <>
              <span className="pm-slash" aria-hidden="true">
                /
              </span>{" "}
            </>
          )}
        </Fragment>
      ))}
    </p>
  );
}

/** Affiliations: ruled rows, each with a square outlined badge of initials. The first badge is in the accent. */
function Orgs({ section }: { section: Of<"orgs"> }) {
  return (
    <ul className="pm-orgs">
      {section.items.map((o, i) => (
        <li key={`${o.name}-${i}`}>
          <span className={`pm-org-badge${i === 0 ? " is-first" : ""}`} aria-hidden="true">
            {orgInitials(o.name)}
          </span>
          <span className="pm-org-text">
            <span className="pm-org-name">{o.name}</span>
            {o.role && <span className="pm-org-role">{o.role}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Soundtrack: a bordered card that opens the song on Spotify. */
function Song({ section }: { section: Of<"song"> }) {
  const v = songView(section, "Hear my song");
  return (
    <a href={section.spotifyUrl} className="pm-song" aria-label={v.aria} target="_blank" rel="noopener noreferrer">
      <span className="pm-song-mark">
        <SpotifyMark size={26} />
      </span>
      <span className="pm-song-text">
        <span className="pm-song-title">{v.heading}</span>
        {v.artist && <span className="pm-song-artist">{v.artist}</span>}
        <span className="pm-song-cta">LISTEN ON SPOTIFY</span>
      </span>
      <ArrowUpRightIcon size={20} />
    </a>
  );
}

/** Video: a solid panel that opens the video. We only have its link, so it shows the host and a play button. */
function Video({ section }: { section: Of<"video"> }) {
  const host = displayUrl(section.url);
  return (
    <a href={section.url} className="pm-video" target="_blank" rel="noopener noreferrer" aria-label={`Watch the video on ${host} (opens in a new tab)`}>
      <span className="pm-video-text">
        <span className="pm-video-kicker">ON FILM</span>
        <span className="pm-video-title">Watch the video</span>
        <span className="pm-video-host">
          <span className="pm-trunc">{host}</span>
          <ArrowUpRightIcon size={14} />
        </span>
      </span>
      <span className="pm-chip pm-video-chip" aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" style={{ marginLeft: 3 }}>
          <path d="M7 4.5v15l12.5-7.5z" />
        </svg>
      </span>
    </a>
  );
}

/** Booking: a headline, one line of help, and a solid bar that opens the booking page. */
function Booking({ section }: { section: Of<"booking"> }) {
  return (
    <div className="pm-booking">
      <div className="pm-booking-lead">
        <span className="pm-booking-head">Book a time with me.</span>
        <span className="pm-booking-sub">Pick a slot on my booking page.</span>
      </div>
      <a href={section.url} className="pm-booking-link" target="_blank" rel="noopener noreferrer">
        <span className="pm-chip pm-booking-chip" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4.5" width="18" height="16.5" rx="2" />
            <path d="M16 2.5v4M8 2.5v4M3 10h18M9 15.5l2 2 4-4" />
          </svg>
        </span>
        <span className="pm-booking-text">
          <span className="pm-booking-title">Book an appointment</span>
          <span className="pm-trunc pm-booking-host">{displayUrl(section.url)}</span>
        </span>
        <ArrowUpRightIcon size={22} strokeWidth={2.2} />
      </a>
    </div>
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
