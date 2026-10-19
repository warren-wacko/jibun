import { displayUrl } from "@/templates/shared/model";

/**
 * Text and contact details of the marketing homepage (`/`). Edit wording here, not in the components.
 *
 * The contact values come from environment variables (read at BUILD time, like every NEXT_PUBLIC_ variable) and
 * fall back to obvious dummy values until the real ones exist. Set them before the real launch:
 * see docs/PRODUCTION.md. The Privacy and Terms links go to the built-in pages (/privacy, /terms) unless a URL is set.
 */
export function marketingContact() {
  // Defaults are the real Jibun Facebook page and number. For now every message button opens the Facebook page (the chat link
  // is https://m.me/61595658624677). Until there is an Instagram account (or another email),
  // those slots point at the Facebook page (the email is still a dummy). Environment variables override all of them.
  const FACEBOOK_PAGE = "https://www.facebook.com/profile.php?id=61595658624677";
  const messenger = process.env.NEXT_PUBLIC_CONTACT_MESSENGER || FACEBOOK_PAGE;
  const instagram = process.env.NEXT_PUBLIC_CONTACT_INSTAGRAM || FACEBOOK_PAGE;
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@jibun.example";
  const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE || "+63 915 428 5226";
  return {
    messenger,
    instagram,
    email,
    phone,
    paymentMethods: process.env.NEXT_PUBLIC_CONTACT_PAYMENT_METHODS || "GCash or Maya",
    privacyUrl: process.env.NEXT_PUBLIC_PRIVACY_URL || "/privacy",
    termsUrl: process.env.NEXT_PUBLIC_TERMS_URL || "/terms",
    /** Where every "Message us" button goes. */
    cta: messenger,
    messengerLabel: displayUrl(messenger),
    instagramLabel: displayUrl(instagram),
    emailHref: `mailto:${email}`,
    phoneHref: `tel:${phone.replace(/[^\d+]/g, "")}`,
  };
}

export const WHY_ROWS = [
  { old: "They type your number by hand.", now: "One tap or scan opens your whole profile." },
  { old: "New job? Reprint the whole box.", now: "Update your page anytime. No reprinting." },
  { old: "Lost in a wallet or a drawer.", now: "Save Contact puts you straight into their phone." },
  { old: "Runs out, so you order again.", now: "Works for 4 years, no monthly fees." },
] as const;

export const STEPS = [
  "You message us and choose a design.",
  "We build your page.",
  "We give you your card. Plain, unless you ask for a customized printed one.",
  "People tap and save your contact.",
] as const;

export const WHO = [
  { icon: "briefcase", title: "Professionals", tag: "Contact-first", text: "Call, email and Save Contact up front. Clean and ready for meetings.", image: "pro-magazine", alt: "Sample professional card" },
  { icon: "cap", title: "Students", tag: "For job seekers and fresh grads", text: "Your course, school and links in one place. Perfect for job fairs and interviews.", image: "student-notebook", alt: "Sample student card" },
  { icon: "sparkle", title: "Creators", tag: "Follow-first", text: "Your socials at the top, so new friends follow you in one tap.", image: "social-bento", alt: "Sample creator card" },
] as const;

export const DESIGNS = [
  { image: "pro-classic", label: "Pro Classic" },
  { image: "pro-magazine", label: "Pro Magazine" },
  { image: "student-notebook", label: "Student Notebook" },
  { image: "social-bento", label: "Social Bento" },
  { image: "social-scrapbook", label: "Social Scrapbook" },
  { image: "social-minimalist", label: "Social Minimalist" },
] as const;

type Cell = string | boolean;

export const PLANS: { name: string; blurb: string; ribbon?: string; rows: [string, Cell][]; note?: string; cta: string }[] = [
  {
    name: "Starter",
    blurb: "Everything you need to start tapping.",
    rows: [
      ["Choose from the launch designs", true],
      ["Light or dark theme", true],
      ["Colour", "Preset palette and school colours"],
      ["Fonts", "Design default"],
      ["Extra sections", "Add-ons only"],
      ["Reorder sections", false],
      ["Revisions included", "1"],
      ["Small edits in the first year", "2"],
    ],
    cta: "Ask about Starter",
  },
  {
    name: "Standard",
    blurb: "Your colours, your fonts, your layout.",
    ribbon: "More freedom",
    rows: [
      ["Choose from the launch designs", true],
      ["Light or dark theme", true],
      ["Colour", "Any colour you like"],
      ["Fonts", "Choose from 4 font pairs"],
      ["Extra sections", "Pick 2 included"],
      ["Reorder sections", true],
      ["Revisions included", "2"],
      ["Small edits in the first year", "4"],
    ],
    note: "Extra sections: skills, services, stats, portfolio, experience, interests, orgs or song.",
    cta: "Ask about Standard",
  },
];

export const ADD_ONS = [
  "Photo gallery",
  "Video",
  "PDF / résumé download",
  "Booking button",
  "Tap and visit stats",
  "Custom domain",
  "Remove \"Digital card by Jibun\"",
  "One extra revision",
] as const;

export const FOUR_YEARS =
  "One-time payment covers your card and page for 4 years, with no monthly or yearly fees. After 4 years, you can keep it active with a small renewal, or upgrade to a new card and design at a discount. We'll remind you before your term ends.";

export function faq(paymentMethods: string): { q: string; a: string }[] {
  return [
    { q: "Do I need an app?", a: "No. It opens in the phone's browser." },
    { q: "Does it work on iPhone and Android?", a: "Yes, on modern phones. The QR code is the backup." },
    { q: "What if the other phone has no NFC?", a: "They scan the QR code." },
    { q: "Can I change my details later?", a: "Yes. You get revisions and small edits; more later are paid per request." },
    { q: "What happens after 4 years?", a: "Renew for a small fee, or upgrade. After a 30-day grace period a lapsed page shows a \"please contact us\" screen." },
    { q: "Can I upgrade Starter to Standard later?", a: "Yes. You keep your link and card and only pay the difference." },
    { q: "What if I lose my card?", a: "We can disable it and give you a new one." },
    { q: "Is my info safe?", a: "You choose what appears on your page. Taps are counted without storing anyone's IP address." },
    { q: "How do I pay?", a: `Orders are taken by message: ${paymentMethods}.` },
  ];
}
