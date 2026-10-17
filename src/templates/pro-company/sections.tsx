import Image from "next/image";
import type { CSSProperties } from "react";
import { ArrowUpRightIcon, FileDownloadIcon } from "@/components/icons";
import type { Section } from "@/lib/page-schema";

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

/** The kinds drawn without a surrounding box (they are made of cards or tiles already). */
export const BARE_KINDS: ReadonlySet<string> = new Set(["services"]);
