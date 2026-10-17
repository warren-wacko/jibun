import Image from "next/image";
import type { CSSProperties } from "react";
import { ArrowUpRightIcon, LinkIcon } from "@/components/icons";
import type { Section } from "@/lib/page-schema";

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
    default:
      return null;
  }
}
