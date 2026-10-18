import Link from "next/link";
import { LEGAL_UPDATED, type LegalDoc } from "@/lib/legal";
import { SiteFooter, SiteFrame, SiteHeader } from "./SiteChrome";

/** A Privacy or Terms page in the same look as the homepage. */
export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <SiteFrame>
      <SiteHeader />
      <main className="wrap legal" id="top">
        <span className="kicker">Updated {LEGAL_UPDATED}</span>
        <h1 className="h1 legal-h">{doc.title}</h1>
        <p className="lead">{doc.intro}</p>
        {doc.blocks.map((b) => (
          <section className="legal-sec" key={b.h}>
            <h2 className="h3">{b.h}</h2>
            {b.p?.map((t) => <p key={t}>{t}</p>)}
            {b.ul && (
              <ul>
                {b.ul.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <Link className="link legal-back" href="/">
          Back to the homepage
        </Link>
      </main>
      <SiteFooter />
    </SiteFrame>
  );
}
