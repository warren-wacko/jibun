import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon } from "@/components/marketing/Icons";
import { SiteFooter, SiteFrame, SiteHeader } from "@/components/marketing/SiteChrome";
import { marketingContact } from "@/lib/marketing";

export const metadata: Metadata = {
  title: "Page not found — Jibun",
  robots: { index: false, follow: false },
};

/** Shown for any address that does not exist, including a username nobody has. */
export default function NotFound() {
  const c = marketingContact();
  return (
    <SiteFrame>
      <SiteHeader />
      <main className="wrap nf" id="top">
        <span className="kicker">404</span>
        <h1 className="h1 nf-h">We can&apos;t find that page.</h1>
        <p className="lead">The link may be mistyped, or the card&apos;s page is no longer active. If you tapped a Jibun card and landed here, message us and we&apos;ll sort it out.</p>
        <div className="cta-row">
          <Link className="btn btn-ink btn-lg" href="/">
            Go to the homepage <ArrowIcon />
          </Link>
          <a className="link" href={c.cta}>
            Message us
          </a>
        </div>
      </main>
      <SiteFooter />
    </SiteFrame>
  );
}
