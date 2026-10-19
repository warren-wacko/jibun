import Image from "next/image";
import type { CSSProperties } from "react";
import { ArrowUpRightIcon, LinkIcon } from "@/components/icons";
import type { Section } from "@/lib/page-schema";
import { displayUrl } from "../shared/model";

type Of<K extends Section["kind"]> = Extract<Section, { kind: K }>;

/** Gallery: photos in a swipeable row, each tilted a little differently, with a small "1 / 6" tag. */
function Gallery({ section }: { section: Of<"gallery"> }) {
  const total = section.images.length;
  return (
    <div className="ps-gallery">
      {section.images.map((img, i) => (
        <figure key={`${img.url}-${i}`} className="ps-gallery-item" style={{ "--tilt": i % 6 } as CSSProperties}>
          <Image src={img.url} alt={img.alt} fill sizes="200px" unoptimized />
          <figcaption>
            {i + 1} / {total}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

/** Portfolio: a rounded card per project with a thumbnail when there is one. */
function Portfolio({ section }: { section: Of<"portfolio"> }) {
  return (
    <div className="ps-stack">
      {section.items.map((p, i) => (
        <a key={`${p.url}-${i}`} href={p.url} className="ps-work" target="_blank" rel="noopener noreferrer">
          {p.thumbUrl && (
            <span className="ps-work-thumb">
              <Image src={p.thumbUrl} alt="" width={76} height={76} unoptimized />
            </span>
          )}
          <span className="ps-work-text">
            <span className="ps-item-title">{p.title}</span>
            {p.desc && <span className="ps-item-desc">{p.desc}</span>}
          </span>
          <ArrowUpRightIcon size={18} className="ps-row-arrow" />
        </a>
      ))}
    </div>
  );
}

/** Services: a card per service with a number badge and the price on the right. */
function Services({ section }: { section: Of<"services"> }) {
  return (
    <div className="ps-stack">
      {section.items.map((s, i) => (
        <div key={`${s.name}-${i}`} className="ps-service">
          <span className="ps-service-n" aria-hidden="true">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="ps-service-name ps-item-title">{s.name}</span>
          {s.price && <span className="ps-price">{s.price}</span>}
        </div>
      ))}
    </div>
  );
}

/** Résumé: a card in the page's accent with a round download button. */
function Resume({ section }: { section: Of<"resume"> }) {
  return (
    <div className="ps-resume">
      <span className="ps-resume-tag" aria-hidden="true">
        PDF
      </span>
      <span className="ps-work-text">
        <span className="ps-resume-title">{section.label ?? "My résumé"}</span>
        <span className="ps-resume-sub">PDF</span>
      </span>
      <a href={section.fileUrl} className="ps-download" aria-label="Download résumé" target="_blank" rel="noopener noreferrer" download>
        <LinkIcon size={20} />
      </a>
    </div>
  );
}

/** Experience: a timeline in one card. The latest entry has the filled dot. */
function Experience({ section }: { section: Of<"experience"> }) {
  return (
    <ol className="ps-timeline">
      {section.items.map((x, i) => (
        <li key={`${x.role}-${i}`} className={i === 0 ? "is-current" : undefined}>
          <span className="ps-time-rail" aria-hidden="true">
            <span className="ps-time-dot" />
          </span>
          <span className="ps-time-body">
            <span className="ps-item-title">{x.role}</span>
            <span className="ps-item-desc">{x.org}</span>
            <span className="ps-time-years">{x.years}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Skills: pills with a small accent dot. */
function Skills({ section }: { section: Of<"skills"> }) {
  return (
    <ul className="ps-chips">
      {section.items.map((k, i) => (
        <li key={`${k}-${i}`}>
          <span className="ps-chip-dot" aria-hidden="true" />
          {k}
        </li>
      ))}
    </ul>
  );
}

/** Stats: up to three cards across, more wrap onto further rows. */
function Stats({ section }: { section: Of<"stats"> }) {
  return (
    <dl className="ps-stats" style={{ "--cols": Math.min(section.items.length, 3) } as CSSProperties}>
      {section.items.map((s, i) => (
        <div key={`${s.label}-${i}`} className="ps-stat">
          <dt>{s.label}</dt>
          <dd>{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The drawing for one optional section, or null for a kind this template has no design for. */
/** Video: a card in the page's accent that opens the video. We only have its link, so it shows a play button and the host. */
function Video({ section }: { section: Of<"video"> }) {
  const host = displayUrl(section.url);
  return (
    <a href={section.url} className="ps-video" target="_blank" rel="noopener noreferrer" aria-label={`Watch the video on ${host}`}>
      <span className="ps-video-top">
        <span>VIDEO</span>
        <span>TAP TO WATCH ↗</span>
      </span>
      <span className="ps-video-play" aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" style={{ marginLeft: 3 }}>
          <path d="M7 4.8v14.4L19 12z" />
        </svg>
      </span>
      <span className="ps-video-foot">
        <span className="ps-video-text">
          <span className="ps-video-title">Watch the video</span>
          <span className="ps-video-host">{host}</span>
        </span>
      </span>
    </a>
  );
}

/** Booking: a card with an icon, a title, the host of the link and a button that opens the booking page. */
function Booking({ section }: { section: Of<"booking"> }) {
  return (
    <a href={section.url} className="ps-booking" target="_blank" rel="noopener noreferrer">
      <span className="ps-booking-row">
        <span className="ps-booking-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
            <path d="M3 9.5h18M8 2.5v4M16 2.5v4M8.5 15l2.5 2.5 4.5-4.5" />
          </svg>
        </span>
        <span className="ps-video-text">
          <span className="ps-booking-title">Book an appointment</span>
          <span className="ps-booking-host">{displayUrl(section.url)}</span>
        </span>
      </span>
      <span className="ps-booking-go">
        Open booking page
        <ArrowUpRightIcon size={18} strokeWidth={2} />
      </span>
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
    default:
      return null;
  }
}
