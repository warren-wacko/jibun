import Image from "next/image";
import { ADD_ONS, DESIGNS, FOUR_YEARS, PLANS, STEPS, WHO, WHY_ROWS, faq, marketingContact } from "@/lib/marketing";
import {
  ArrowIcon,
  BriefcaseIcon,
  CallIcon,
  CapIcon,
  CardIcon,
  ChatIcon,
  CrossIcon,
  DashIcon,
  InstagramIcon,
  JibunCardMini,
  MailIcon,
  MessengerIcon,
  NfcIcon,
  PaperCardMini,
  PhoneIcon,
  SparkleIcon,
  TapArt,
  TickIcon,
  WandIcon,
} from "./Icons";
import { bricolage, inter } from "./fonts";
import "./marketing.css";

const WHO_ICONS = { briefcase: <BriefcaseIcon />, cap: <CapIcon />, sparkle: <SparkleIcon /> };

/** A phone frame around a sample card screenshot (pre-optimised WebP, so no image optimiser is needed). */
function PhoneShot({ image, alt, className = "", priority = false }: { image: string; alt: string; className?: string; priority?: boolean }) {
  return (
    <div className={`phone ${className}`.trim()}>
      <Image src={`/marketing/${image}.webp`} alt={alt} width={390} height={844} unoptimized priority={priority} loading={priority ? undefined : "lazy"} />
    </div>
  );
}

const Wordmark = ({ small = false }: { small?: boolean }) => (
  <a href="#top" className={`logo${small ? " logo-sm" : ""}`} aria-label={small ? undefined : "Jibun home"}>
    jibun<span className="dot">.</span>
  </a>
);

/** The marketing homepage. Server-rendered, no client JavaScript: the compare toggle and the FAQ are plain CSS and <details>. */
export function MarketingHome() {
  const c = marketingContact();

  return (
    <div className={`jb ${bricolage.variable} ${inter.variable}`}>
      <header className="hdr">
        <div className="wrap hdr-in">
          <Wordmark />
          <nav className="nav">
            <a href="#how-it-works">How it works</a>
            <a href="#faq">FAQ</a>
          </nav>
          <a className="btn btn-sm btn-ink" href={c.cta}>
            Message us
          </a>
        </div>
      </header>

      <main id="top">
        <section className="hero wrap">
          <div className="hero-copy">
            <span className="hangtag">
              <span className="hangtag-hole" aria-hidden="true" />
              <span className="hangtag-text">
                <b>NFC digital cards</b>
                <small>Made in the Philippines</small>
              </span>
            </span>
            <h1 className="h1">
              Yourself, <span className="hl">One tap</span> away.
            </h1>
            <p className="lead">A digital card that opens your whole profile with a tap. No app needed. Pang-professional, pang-estudyante, pang-creator.</p>
            <div className="cta-row">
              <a className="btn btn-ink btn-lg" href={c.cta}>
                Get your card <ArrowIcon />
              </a>
              <a className="link" href="#how-it-works">
                See how it works
              </a>
            </div>
            <ul className="ticks">
              <li>
                <TickIcon /> Works on iPhone and Android
              </li>
              <li>
                <TickIcon /> QR code backup on every card
              </li>
            </ul>
          </div>
          <div className="hero-art">
            <div className="blob" />
            <PhoneShot image="pro-classic" alt="Sample card of a fictional professional on a phone" className="phone-hero" priority />
            <TapArt />
          </div>
        </section>

        <section className="sec wrap" aria-labelledby="why-h">
          <span className="kicker">Paper vs Jibun</span>
          <h2 className="h2" id="why-h">
            Why it beats a paper card
          </h2>
          <input className="vs-r" type="radio" name="vsmode-m" id="vs-paper-m" />
          <input className="vs-r" type="radio" name="vsmode-m" id="vs-jibun-m" defaultChecked />
          <div className="vs-toggle" role="group" aria-label="Compare">
            <label htmlFor="vs-paper-m">Paper card</label>
            <label htmlFor="vs-jibun-m">Jibun</label>
            <span className="vs-knob" aria-hidden="true" />
          </div>
          <div className="vs">
            <div className="vs-head">
              <span className="vs-lab vs-lab-old">
                <PaperCardMini /> Paper card
              </span>
              <span className="vs-lab vs-lab-new">
                <JibunCardMini /> Jibun
              </span>
            </div>
            {WHY_ROWS.map((row) => (
              <div className="vs-row" key={row.old}>
                <p className="vs-old">
                  <span className="vs-x">
                    <CrossIcon />
                  </span>
                  <span className="vs-t">{row.old}</span>
                </p>
                <p className="vs-new">
                  <span className="vs-ck">
                    <TickIcon sw={2.8} />
                  </span>
                  <span>{row.now}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="sec band" id="how-it-works" aria-labelledby="how-h">
          <div className="wrap how">
            <div className="how-intro">
              <span className="kicker">How it works</span>
              <h2 className="h2" id="how-h">
                Four easy steps, zero apps.
              </h2>
              <p className="sub">It all starts with a message. Here&apos;s how a typical order goes.</p>
              <ol className="how-list">
                {STEPS.map((text, i) => (
                  <li key={text}>
                    <span className="hn">{String(i + 1).padStart(2, "0")}</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="chat" role="img" aria-label="Example chat: you message Jibun, choose a design, get your page and card, then a new contact taps and saves you">
              <div className="chat-top">
                <span className="chat-av">j</span>
                <div>
                  <b>jibun.</b>
                  <small>Usually replies within the day</small>
                </div>
              </div>
              <div className="chat-body">
                <span className="chat-step">
                  <ChatIcon /> Step 1 · Message us
                </span>
                <p className="bub me">Hi! I&apos;d love a Jibun card. Pwede po the Student Notebook design?</p>
                <span className="chat-step">
                  <WandIcon /> Step 2 · We build your page
                </span>
                <p className="bub them">Love that pick! Building your page now. Here&apos;s a preview:</p>
                <div className="bub them bub-img">
                  <Image src="/marketing/student-notebook.webp" alt="" width={390} height={844} unoptimized loading="lazy" />
                </div>
                <span className="chat-step">
                  <CardIcon /> Step 3 · Get your card
                </span>
                <p className="bub them">Your card is ready. Plain black, or we can print a custom one if you ask.</p>
                <div className="bub them bub-card">
                  <div className="mini-card">
                    <span className="mc-logo">
                      jibun<i>.</i>
                    </span>
                    <NfcIcon />
                  </div>
                </div>
                <span className="chat-step">
                  <PhoneIcon /> Step 4 · Tap and connect
                </span>
                <p className="bub friend">
                  <span className="bub-who">New contact</span>Just tapped your card. Saved you na!
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="sec wrap" aria-labelledby="who-h">
          <span className="kicker">Who it&apos;s for</span>
          <h2 className="h2" id="who-h">
            Made for how you connect.
          </h2>
          <div className="grid3">
            {WHO.map((w) => (
              <article className="who" key={w.title}>
                <div className="who-top">
                  <span className="ficon">{WHO_ICONS[w.icon]}</span>
                  <div>
                    <h3 className="h3">{w.title}</h3>
                    <span className="tag">{w.tag}</span>
                  </div>
                </div>
                <p>{w.text}</p>
                <PhoneShot image={w.image} alt={w.alt} className="phone-sm" />
              </article>
            ))}
          </div>
        </section>

        <section className="sec" id="designs" aria-labelledby="des-h">
          <div className="wrap">
            <span className="kicker">Sample designs</span>
            <h2 className="h2" id="des-h">
              Pick a look. Make it yours.
            </h2>
            <p className="sub">More designs available. Every design works for everyone.</p>
          </div>
          <div className="shelf">
            {DESIGNS.map((d) => (
              <figure className="des" key={d.image}>
                <PhoneShot image={d.image} alt={`${d.label} sample design with a fictional person`} />
                <figcaption>{d.label}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="sec wrap" id="plans" aria-labelledby="plans-h">
          <span className="kicker">Starter and Standard</span>
          <h2 className="h2" id="plans-h">
            Two ways to start.
          </h2>
          <div className="plans">
            {PLANS.map((plan, i) => (
              <article className={`plan${plan.ribbon ? " plan-hi" : ""}`} key={plan.name}>
                {plan.ribbon && <span className="ribbon">{plan.ribbon}</span>}
                <h3 className="plan-n">{plan.name}</h3>
                <p className="plan-b">{plan.blurb}</p>
                <ul className="plan-l">
                  {plan.rows.map(([label, value]) => (
                    <li key={label}>
                      <span className="pl">{label}</span>
                      {value === true ? (
                        <span className="yes">
                          <TickIcon size={18} sw={2.4} />
                          <span>Yes</span>
                        </span>
                      ) : value === false ? (
                        <span className="no">
                          <DashIcon />
                          <span>No</span>
                        </span>
                      ) : (
                        <span className="val">{value}</span>
                      )}
                    </li>
                  ))}
                </ul>
                {plan.note && <p className="plan-x">{plan.note}</p>}
                <a className={`btn ${i === 0 ? "btn-line" : "btn-accent"}`} href={c.cta}>
                  {plan.cta}
                </a>
              </article>
            ))}
          </div>
          <div className="price-cta">
            <p className="h3">Prices? Just message us.</p>
            <a className="btn btn-ink" href={c.cta}>
              Ask for prices <ArrowIcon />
            </a>
          </div>
          <div className="addons">
            <p className="addons-t">Add-ons</p>
            <ul className="chips">
              {ADD_ONS.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <p className="note">Need something special? Ask for a custom quote. Both plans come with a plain card; a customized printed card is made only on request.</p>
          </div>
        </section>

        <section className="sec wrap">
          <div className="years">
            <div className="years-badge">
              <span className="years-n">4</span>
              <span className="years-l">years</span>
            </div>
            <div>
              <h2 className="h2">Your card, your 4 years.</h2>
              <p className="lead">{FOUR_YEARS}</p>
            </div>
          </div>
        </section>

        <section className="sec wrap" id="faq" aria-labelledby="faq-h">
          <span className="kicker">FAQ</span>
          <h2 className="h2" id="faq-h">
            Questions, answered.
          </h2>
          <div className="faq">
            {faq(c.paymentMethods).map((item) => (
              <details className="q" key={item.q}>
                <summary>
                  <span>{item.q}</span>
                  <span className="plus" aria-hidden="true" />
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="sec wrap" id="contact" aria-labelledby="cta-h">
          <div className="final">
            <h2 className="h1 final-h" id="cta-h">
              Yourself, <span className="hl">One tap</span> away.
            </h2>
            <p className="lead final-l">Tell us what you need and we&apos;ll help you pick a design.</p>
            <a className="btn btn-accent btn-lg" href={c.cta}>
              Message us to get yours <ArrowIcon />
            </a>
            <ul className="channels">
              <li>
                <a href={c.messenger}>
                  <MessengerIcon />
                  <span>Messenger</span>
                  <small>{c.messengerLabel}</small>
                </a>
              </li>
              <li>
                <a href={c.instagram}>
                  <InstagramIcon />
                  <span>Instagram</span>
                  <small>{c.instagramLabel}</small>
                </a>
              </li>
              <li>
                <a href={c.emailHref}>
                  <MailIcon />
                  <span>Email</span>
                  <small>{c.email}</small>
                </a>
              </li>
              <li>
                <a href={c.phoneHref}>
                  <CallIcon />
                  <span>Phone</span>
                  <small>{c.phone}</small>
                </a>
              </li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="ftr">
        <div className="wrap ftr-in">
          <div>
            <Wordmark small />
            <p className="ftr-line">Digital card by Jibun</p>
          </div>
          <div className="ftr-links">
            <a href={c.messenger}>Messenger</a>
            <a href={c.instagram}>Instagram</a>
            <a href={c.emailHref}>Email</a>
            <a href={c.phoneHref}>Phone</a>
          </div>
          {(c.privacyUrl || c.termsUrl) && (
            <div className="ftr-links">
              {c.privacyUrl && <a href={c.privacyUrl}>Privacy</a>}
              {c.termsUrl && <a href={c.termsUrl}>Terms</a>}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
