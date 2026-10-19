import type { CSSProperties } from "react";
import { ArrowUpRightIcon, AwardIcon } from "@/components/icons";
import { SocialIcon } from "@/components/SocialIcon";
import type { Section } from "@/lib/page-schema";
import { displayUrl } from "../shared/model";
import type { OnlineTile } from "./model";

type Of<K extends Section["kind"]> = Extract<Section, { kind: K }>;

/** Projects: cards you swipe through, each with a coloured band on top and a slight tilt. */
function Projects({ section }: { section: Of<"portfolio"> }) {
  const items = section.items;
  return (
    <div className="pn-projects" data-block="portfolio">
      <div className="pn-sec-row">
        <span className="pn-h2">Projects</span>
        {items.length > 1 && (
          <span className="pn-swipe" aria-hidden="true">
            swipe →
          </span>
        )}
      </div>
      <div className="pn-cards">
        {items.map((p, i) => (
          <a key={`${p.url}-${i}`} href={p.url} className="pn-project" data-i={i % 3} target="_blank" rel="noopener noreferrer">
            <span className="pn-project-band" />
            <span className="pn-project-body">
              <span className="pn-project-top">
                <ArrowUpRightIcon size={16} strokeWidth={1.9} />
              </span>
              <span className="pn-project-title">{p.title}</span>
              {p.desc && <span className="pn-project-desc">{p.desc}</span>}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

/** Skills: stickers, every third one in the highlighter colour, slightly tilted. */
function Skills({ section }: { section: Of<"skills"> }) {
  return (
    <div className="pn-skills" data-block="skills">
      <span className="pn-h2">Skills</span>
      <ul className="pn-stickers">
        {section.items.map((k, i) => (
          <li key={`${k}-${i}`} data-i={i % 3}>
            {k}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Wins and orgs: one card with a row per entry. */
function Wins({ section }: { section: Of<"orgs"> }) {
  return (
    <div className="pn-wins" data-block="orgs">
      <span className="pn-h2">Wins &amp; orgs</span>
      <ul className="pn-win-list">
        {section.items.map((o, i) => (
          <li key={`${o.name}-${i}`}>
            <span className="pn-win-icon" aria-hidden="true">
              <AwardIcon size={19} strokeWidth={1.9} />
            </span>
            <span className="pn-win-text">
              <span className="pn-win-title">{o.name}</span>
              {o.role && <span className="pn-win-sub">{o.role}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const PLAY = "M8 5.5v13l11-6.5z";
const CALENDAR_CHECK = (
  <>
    <rect x="3" y="4.5" width="18" height="16.5" rx="2" />
    <path d="M16 2.5v4M8 2.5v4M3 10h18M8.5 15l2.5 2.5 4.5-4.5" />
  </>
);

/** Video (Standard design): a paper card taped on, with a grid "screen", a play button and the host of the link. */
function Video({ section }: { section: Of<"video"> }) {
  const host = displayUrl(section.url);
  return (
    <div className="pn-addon pn-video" data-block="video">
      <div className="pn-sec-row pn-sec-row-flush">
        <span className="pn-h2">Video</span>
        <span className="pn-swipe" aria-hidden="true">
          tap to watch
        </span>
      </div>
      <div className="pn-taped">
        <a href={section.url} className="pn-video-card" target="_blank" rel="noopener noreferrer" aria-label={`Watch the video on ${host} (opens in a new tab)`}>
          <span className="pn-video-screen">
            <span className="pn-video-play" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
                <path d={PLAY} />
              </svg>
            </span>
          </span>
          <span className="pn-video-foot">
            <span className="pn-addon-text">
              <span className="pn-video-kicker">VIDEO</span>
              <span className="pn-video-title">Watch on {host}</span>
            </span>
            <ArrowUpRightIcon size={18} strokeWidth={1.9} />
          </span>
        </a>
        <span className="pn-tape" aria-hidden="true" />
      </div>
    </div>
  );
}

/** Booking (Standard design): a heading with a handwritten note, and a card row that opens the booking page. */
function Booking({ section }: { section: Of<"booking"> }) {
  return (
    <div className="pn-addon pn-booking" data-block="booking">
      <div className="pn-sec-row pn-sec-row-flush">
        <span className="pn-h2">Book a chat</span>
        <span className="pn-swipe" aria-hidden="true">
          opens my calendar
        </span>
      </div>
      <a href={section.url} className="pn-addon-row pn-addon-row-lg pn-addon-row-square" target="_blank" rel="noopener noreferrer">
        <span className="pn-addon-chip pn-addon-chip-lg" aria-hidden="true">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            {CALENDAR_CHECK}
          </svg>
        </span>
        <span className="pn-addon-text">
          <span className="pn-addon-title">Book a time with me</span>
          <span className="pn-addon-host">{displayUrl(section.url)}</span>
        </span>
        <ArrowUpRightIcon size={18} strokeWidth={1.9} />
      </a>
    </div>
  );
}

/** The Starter layout's video: a small row under a heading (the Starter has no taped card). */
export function StarterVideo({ section }: { section: Of<"video"> }) {
  const host = displayUrl(section.url);
  return (
    <section className="pn-section" data-block="video">
      <span className="pn-h2">Video</span>
      <a href={section.url} className="pn-addon-row" target="_blank" rel="noopener noreferrer" aria-label={`Watch the video on ${host} (opens in a new tab)`}>
        <span className="pn-addon-chip pn-addon-chip-round" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
            <path d={PLAY} />
          </svg>
        </span>
        <span className="pn-addon-text">
          <span className="pn-addon-title">Watch my video</span>
          <span className="pn-addon-host">{host}</span>
        </span>
        <ArrowUpRightIcon size={18} strokeWidth={1.9} />
      </a>
    </section>
  );
}

/** The Starter layout's booking: a small row under a heading. */
export function StarterBooking({ section }: { section: Of<"booking"> }) {
  return (
    <section className="pn-section" data-block="booking">
      <span className="pn-h2">Book a chat</span>
      <a href={section.url} className="pn-addon-row" target="_blank" rel="noopener noreferrer">
        <span className="pn-addon-chip pn-addon-chip-square" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            {CALENDAR_CHECK}
          </svg>
        </span>
        <span className="pn-addon-text">
          <span className="pn-addon-title">Book a time with me</span>
          <span className="pn-addon-host">{displayUrl(section.url)}</span>
        </span>
        <ArrowUpRightIcon size={18} strokeWidth={1.9} />
      </a>
    </section>
  );
}

/** The drawing for one optional section, or null for a kind this template has no design for. */
export function SectionBlock({ section }: { section: Section }) {
  switch (section.kind) {
    case "portfolio":
      return <Projects section={section} />;
    case "skills":
      return <Skills section={section} />;
    case "orgs":
      return <Wins section={section} />;
    case "video":
      return <Video section={section} />;
    case "booking":
      return <Booking section={section} />;
    default:
      return null;
  }
}

/** "Find me online": every link as a tile with its brand chip. */
export function OnlineTiles({ tiles }: { tiles: OnlineTile[] }) {
  return (
    <div className="pn-online" style={{ "--cols": Math.min(tiles.length, 2) } as CSSProperties}>
      {tiles.map((t) => (
        <a key={t.key} href={t.url} className="pn-online-tile" target="_blank" rel="noopener noreferrer">
          <SocialIcon type={t.type} size={34} glyphSize={17} radius={9} />
          <span className="pn-online-name">{t.label}</span>
        </a>
      ))}
    </div>
  );
}
