/**
 * Wording of the Privacy and Terms pages. A plain-language DRAFT written from how the app works today
 * (what it stores, what it logs, how a term runs). It is not legal advice: have it checked before launch,
 * and update it when the service changes (for example when photo upload or the contact form is added).
 */
export type LegalBlock = { h: string; p?: string[]; ul?: string[] };
export type LegalDoc = { title: string; intro: string; blocks: LegalBlock[] };

/** Bump when the wording changes. */
export const LEGAL_UPDATED = "October 18, 2026";

export function privacyDoc(email: string): LegalDoc {
  return {
    title: "Privacy",
    intro:
      "Jibun sells NFC digital cards in the Philippines. This page explains what we collect, why, and the choices you have. We try to collect as little as we can.",
    blocks: [
      {
        h: "Who we are",
        p: [`Jibun ("we", "us") is the business behind jibun cards and the pages they open. For anything about your data, write to ${email}.`],
      },
      {
        h: "What we collect",
        p: ["It depends on who you are."],
        ul: [
          "If you order a card: your name, how to reach you (for example a phone number or email) and what you want on your page: title, company, bio, links, photo and the contact details you choose to show. We also keep a note of what you paid and when.",
          "If you tap or scan a card: nothing is asked of you and you have no account. When a card is tapped we record the time, whether it was a tap or a QR scan, a rough device type (iPhone, Android, computer) and the country when the hosting service provides it. We do not store IP addresses. To prevent abuse we look at the IP address for a moment in memory to limit repeated requests; it is not saved.",
          "If you save someone's contact from their page: the file comes from the page and goes to your phone. We do not keep a copy or a record of who saved it.",
        ],
      },
      {
        h: "What your page shows",
        p: [
          "A card page is public: anyone who has the link, taps the card or scans the QR code can see it. We ask search engines not to list client pages, but we cannot control who you share the link with or what others do with the details they see.",
          "You decide what goes on your page. You can ask us to hide your phone number, leave out your location, or remove anything else at any time.",
        ],
      },
      {
        h: "Cookies and tracking",
        p: [
          "Visitors get no cookies from us. We do not use advertising, analytics scripts or tracking pixels, and we do not load fonts or code from other companies on the pages you visit. The only cookie we set is the sign-in cookie used by us to manage the service.",
        ],
      },
      {
        h: "Where it is kept",
        p: [
          "Your information is stored with the services we use to run Jibun: a hosting provider, a database provider and, once photo upload is on, an image host. Their servers may be outside the Philippines. We give them only what they need to run the service.",
        ],
      },
      {
        h: "How long we keep it",
        ul: [
          "Your page and its tap records are kept while your page exists: the 4 years of your term, plus a 30-day grace period.",
          "After that your page is switched off. We keep it for a while so you can renew, or ask for an export of your page and your contact file.",
          "You can ask us to delete your page and your details at any time. We may keep a record of the order and payment where we need it for our accounts.",
        ],
      },
      {
        h: "Your rights",
        p: [
          "Under the Data Privacy Act of 2012 you have the right to know how your personal data is used, to see it, to correct it, to object to its use, to have it blocked or deleted, to receive a copy, and to complain to the National Privacy Commission.",
          `To use any of these, write to ${email} from the contact you gave us. We will answer as soon as we can.`,
        ],
      },
      {
        h: "Keeping it safe",
        p: [
          "Pages are served over HTTPS, the admin area is protected by a password that is stored only in scrambled form, and only we can sign in to it. No system is perfectly safe, so please tell us at once if you think your page or your card has been misused.",
        ],
      },
      {
        h: "Under 18",
        p: ["If you are under 18, please ask a parent or guardian to agree to the order for you."],
      },
      {
        h: "Changes",
        p: ["If this page changes in a way that matters, we will update the date at the top and, for clients, tell you directly."],
      },
    ],
  };
}

export function termsDoc(email: string): LegalDoc {
  return {
    title: "Terms",
    intro: "These are the plain terms for buying and using a Jibun card. By ordering a card you agree to them.",
    blocks: [
      {
        h: "What you get",
        p: [
          "A Jibun card is an NFC card (with a QR code as a backup) that opens your own page. You choose a design. We build your page and give you your card. Both Starter and Standard come with a plain card; a customized printed card is made only if you ask for one.",
          "What each plan includes (designs, colours, fonts, extra sections, revisions and small edits) is as we told you when you ordered. Add-ons are separate.",
        ],
      },
      {
        h: "Orders and payment",
        p: [
          "Orders are taken by message. We tell you the price before you pay, and you pay by the method we agree on (for example GCash or Maya). The price is a one-time payment, with no monthly or yearly fees during your term.",
        ],
      },
      {
        h: "Your 4-year term",
        p: [
          "Your payment covers your card and page for 4 years from the date of purchase. We will remind you before it ends. At the end you can renew for a small fee, or buy a new card and design at a discount.",
          "If the term ends and you have not renewed, your page keeps working for a 30-day grace period. After that it shows a message asking visitors to contact us. You can ask us for an export of your page and your contact file.",
        ],
      },
      {
        h: "Changes to your page",
        p: [
          "The revisions and small edits in your plan are included. More changes later are paid per request. You can upgrade from Starter to Standard later by paying the difference; your link, card and content stay as they are.",
        ],
      },
      {
        h: "Lost or damaged cards",
        p: ["If you lose your card, tell us. We can switch that card off so nobody else can use it, and give you a new one."],
      },
      {
        h: "Your content",
        ul: [
          "You are responsible for what is on your page and you promise it is yours to share and is not unlawful, misleading, hateful or harmful.",
          "Do not pretend to be someone else or use another person's details without their permission.",
          "You keep ownership of your content. You let us store and show it so the service works.",
          "We may switch off a page that breaks these terms. We will tell you why where we can.",
        ],
      },
      {
        h: "Our designs",
        p: [
          "The designs, layouts and code behind the pages stay ours. You may use your page and your card, but you may not copy, resell or reproduce our designs or templates.",
        ],
      },
      {
        h: "What we can promise",
        p: [
          "NFC works with most modern phones but not every phone, which is why every card also has a QR code. We work to keep pages online and working, but we cannot promise they will never be interrupted. To the extent the law allows, our responsibility to you is limited to the amount you paid for your card.",
        ],
      },
      {
        h: "Governing law",
        p: ["These terms are governed by the laws of the Philippines."],
      },
      {
        h: "Questions",
        p: [`Write to ${email}. If these terms change, we will update the date at the top.`],
      },
    ],
  };
}
