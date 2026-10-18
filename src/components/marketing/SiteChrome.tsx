import Link from "next/link";
import { marketingContact } from "@/lib/marketing";
import { bricolage, inter } from "./fonts";
import { ArrowIcon, CallIcon, InstagramIcon, MailIcon, MessengerIcon } from "./Icons";
import "./marketing.css";

/** The wordmark. On the homepage it scrolls to the top; on other pages it goes home. */
export function Wordmark({ small = false, large = false, home = false }: { small?: boolean; large?: boolean; home?: boolean }) {
  const inner = (
    <>
      jibun<span className="dot">.</span>
    </>
  );
  const className = `logo${small ? " logo-sm" : ""}${large ? " logo-lg" : ""}`;
  const label = small || large ? undefined : "Jibun home";
  return home ? (
    <a href="#top" className={className} aria-label={label}>
      {inner}
    </a>
  ) : (
    <Link href="/" className={className} aria-label={label}>
      {inner}
    </Link>
  );
}

/** Page wrapper that carries the marketing fonts and colours. */
export function SiteFrame({ children }: { children: React.ReactNode }) {
  return <div className={`jb ${bricolage.variable} ${inter.variable}`}>{children}</div>;
}

/** Sticky header. `home` is true on the homepage, where the nav links are anchors on the same page. */
export function SiteHeader({ home = false }: { home?: boolean }) {
  const c = marketingContact();
  const prefix = home ? "" : "/";
  return (
    <header className="hdr">
      <div className="wrap hdr-in">
        <Wordmark home={home} />
        <nav className="nav">
          <a href={`${prefix}#how-it-works`}>How it works</a>
          <a href={`${prefix}#faq`}>FAQ</a>
        </nav>
        <a className="btn btn-sm btn-ink" href={c.cta}>
          Message us
        </a>
      </div>
    </header>
  );
}

export function SiteFooter({ home = false }: { home?: boolean }) {
  const c = marketingContact();
  const prefix = home ? "" : "/";
  return (
    <footer className="ftr">
      <div className="wrap">
        <div className="ftr-top">
          <div className="ftr-brand">
            <Wordmark large home={home} />
            <p className="ftr-tag">Yourself, One tap away.</p>
            <a className="btn btn-ink btn-sm" href={c.cta}>
              Message us <ArrowIcon />
            </a>
          </div>
          <nav className="ftr-cols" aria-label="Footer">
            <div>
              <p className="ftr-h">Explore</p>
              <ul>
                <li>
                  <a href={`${prefix}#how-it-works`}>How it works</a>
                </li>
                <li>
                  <a href={`${prefix}#designs`}>Sample designs</a>
                </li>
                <li>
                  <a href={`${prefix}#plans`}>Plans</a>
                </li>
                <li>
                  <a href={`${prefix}#faq`}>FAQ</a>
                </li>
              </ul>
            </div>
            <div>
              <p className="ftr-h">Contact</p>
              <ul>
                <li>
                  <a href={c.messenger}>
                    <MessengerIcon /> Messenger
                  </a>
                </li>
                <li>
                  <a href={c.instagram}>
                    <InstagramIcon /> Instagram
                  </a>
                </li>
                <li>
                  <a href={c.emailHref}>
                    <MailIcon /> Email
                  </a>
                </li>
                <li>
                  <a href={c.phoneHref}>
                    <CallIcon /> Phone
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="ftr-h">Legal</p>
              <ul>
                <li>
                  <a href={c.privacyUrl}>Privacy</a>
                </li>
                <li>
                  <a href={c.termsUrl}>Terms</a>
                </li>
              </ul>
            </div>
          </nav>
        </div>
        <div className="ftr-bar">
          <p>Digital card by Jibun</p>
          <a href="#top">Back to top ↑</a>
        </div>
      </div>
      <div className="ftr-mark" aria-hidden="true" />
    </footer>
  );
}
