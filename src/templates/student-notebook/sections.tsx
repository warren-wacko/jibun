import type { CSSProperties } from "react";
import { ArrowUpRightIcon, AwardIcon } from "@/components/icons";
import { SocialIcon } from "@/components/SocialIcon";
import type { Section } from "@/lib/page-schema";
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

/** The drawing for one optional section, or null for a kind this template has no design for. */
export function SectionBlock({ section }: { section: Section }) {
  switch (section.kind) {
    case "portfolio":
      return <Projects section={section} />;
    case "skills":
      return <Skills section={section} />;
    case "orgs":
      return <Wins section={section} />;
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
