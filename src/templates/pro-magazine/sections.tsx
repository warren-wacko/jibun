import Image from "next/image";
import type { CSSProperties } from "react";
import { ArrowUpRightIcon, LinkIcon } from "@/components/icons";
import type { Section } from "@/lib/page-schema";

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
