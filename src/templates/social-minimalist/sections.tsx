import Image from "next/image";
import { ArrowUpRightIcon } from "@/components/icons";
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


/** Résumé: an outlined pill with the label and a round download button. */
function Resume({ section }: { section: Of<"resume"> }) {
  return (
    <div className="mn-block" data-block="resume">
      <div className="mn-dump-head mn-head-gap">
        <span className="mn-label">Résumé</span>
        <span className="mn-serif-note">the long version</span>
      </div>
      <a href={section.fileUrl} className="mn-resume" download target="_blank" rel="noopener noreferrer">
        <span className="mn-resume-label">{section.label ?? "Résumé / CV"}</span>
        <span className="mn-resume-chip" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3.5v12M7 10.5l5 5 5-5M5 20.5h14" />
          </svg>
        </span>
      </a>
    </div>
  );
}

/** The heading of a list section: a small label on the left and a serif italic note on the right. */
function Head({ label, note }: { label: string; note: string }) {
  return (
    <div className="mn-dump-head mn-head-gap">
      <span className="mn-label">{label}</span>
      <span className="mn-serif-note">{note}</span>
    </div>
  );
}

/** Stats: a two-column grid with a hairline above each, a big number and a small label. */
function Stats({ section }: { section: Of<"stats"> }) {
  return (
    <div className="mn-block" data-block="stats">
      <Head label="Stats" note="so far" />
      <div className="mn-stats">
        {section.items.map((s, i) => (
          <div key={`${s.label}-${i}`} className="mn-stat">
            <span className="mn-stat-value">{s.value}</span>
            <span className="mn-stat-label">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Portfolio: a numbered list of ruled rows, each with a small thumbnail on the right when there is one. */
function Portfolio({ section }: { section: Of<"portfolio"> }) {
  return (
    <div className="mn-block" data-block="portfolio">
      <Head label="Portfolio" note="things I made" />
      <div className="mn-rows">
        {section.items.map((p, i) => (
          <a key={`${p.url}-${i}`} href={p.url} className="mn-row mn-work" target="_blank" rel="noopener noreferrer">
            <span className="mn-row-num" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="mn-work-text">
              <span className="mn-row-title">{p.title}</span>
              {p.desc && <span className="mn-work-desc">{p.desc}</span>}
            </span>
            {p.thumbUrl && (
              <span className="mn-work-thumb">
                <Image src={p.thumbUrl} alt="" fill sizes="56px" unoptimized />
              </span>
            )}
            <ArrowUpRightIcon size={16} strokeWidth={1.8} className="mn-row-go" />
          </a>
        ))}
      </div>
    </div>
  );
}

/** Services: ruled rows, the name on the left and the price in serif italic on the right where there is one. */
function Services({ section }: { section: Of<"services"> }) {
  return (
    <div className="mn-block" data-block="services">
      <Head label="Services" note="what I offer" />
      <ul className="mn-rows mn-services">
        {section.items.map((s, i) => (
          <li key={`${s.name}-${i}`} className="mn-row">
            <span className="mn-service-name">{s.name}</span>
            {s.price && <span className="mn-service-price">{s.price}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Experience: ruled rows with the years in mono, the role, and the organization after a serif "at". */
function Experience({ section }: { section: Of<"experience"> }) {
  return (
    <div className="mn-block" data-block="experience">
      <Head label="Experience" note="where I've been" />
      <ol className="mn-rows mn-exp">
        {section.items.map((x, i) => (
          <li key={`${x.role}-${i}`} className="mn-row">
            <span className="mn-exp-years">{x.years}</span>
            <span className="mn-row-title">{x.role}</span>
            <span className="mn-exp-org">
              <span className="mn-exp-at">at</span> {x.org}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Skills: outlined pills that wrap. */
function Skills({ section }: { section: Of<"skills"> }) {
  return (
    <div className="mn-block mn-skills-wrap" data-block="skills">
      <Head label="Skills" note="good at" />
      <ul className="mn-skills">
        {section.items.map((k, i) => (
          <li key={`${k}-${i}`}>{k}</li>
        ))}
      </ul>
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
    case "resume":
      return <Resume section={section} />;
    case "stats":
      return <Stats section={section} />;
    case "skills":
      return <Skills section={section} />;
    case "portfolio":
      return <Portfolio section={section} />;
    case "services":
      return <Services section={section} />;
    case "experience":
      return <Experience section={section} />;
    case "video":
      return <Video section={section} />;
    case "booking":
      return <Booking section={section} />;
    default:
      return null;
  }
}
