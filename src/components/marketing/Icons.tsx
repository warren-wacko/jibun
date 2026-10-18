import type { ReactNode } from "react";

/** Stroke icons of the marketing homepage (paths from the design reference). */
function Icon({ size = 22, sw = 1.9, children }: { size?: number; sw?: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const ArrowIcon = () => (
  <Icon size={18} sw={2.2}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);
export const TickIcon = ({ size = 16, sw = 2.6 }: { size?: number; sw?: number }) => (
  <Icon size={size} sw={sw}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
);
export const CrossIcon = () => (
  <Icon size={12} sw={2.8}>
    <path d="M7 7l10 10M17 7 7 17" />
  </Icon>
);
export const DashIcon = () => (
  <Icon size={18} sw={2.4}>
    <path d="M6 12h12" />
  </Icon>
);
export const ChatIcon = ({ size = 14, sw = 2.2 }: { size?: number; sw?: number }) => (
  <Icon size={size} sw={sw}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Icon>
);
export const WandIcon = () => (
  <Icon size={14} sw={2.2}>
    <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8 19 13M17.8 6.2 19 5M3 21l9-9M12.2 6.2 11 5" />
  </Icon>
);
export const CardIcon = () => (
  <Icon size={14} sw={2.2}>
    <rect x="2" y="5" width="20" height="14" rx="3" />
    <path d="M2 10h20" />
  </Icon>
);
export const PhoneIcon = () => (
  <Icon size={14} sw={2.2}>
    <rect x="6" y="2" width="12" height="20" rx="3" />
    <path d="M11 18h2" />
  </Icon>
);
export const NfcIcon = () => (
  <Icon size={22} sw={2.2}>
    <path d="M8.5 7.5a6 6 0 0 1 0 9M12 5a10 10 0 0 1 0 14M15.5 2.5a14 14 0 0 1 0 19M5 10.5a2 2 0 0 1 0 3" />
  </Icon>
);
export const BriefcaseIcon = () => (
  <Icon>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </Icon>
);
export const CapIcon = () => (
  <Icon>
    <path d="M22 10 12 5 2 10l10 5 10-5z" />
    <path d="M6 12v5c3 2 9 2 12 0v-5" />
  </Icon>
);
export const SparkleIcon = () => (
  <Icon>
    <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z" />
  </Icon>
);
export const MessengerIcon = () => (
  <Icon size={20}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Icon>
);
export const InstagramIcon = () => (
  <Icon size={20}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" />
  </Icon>
);
export const MailIcon = () => (
  <Icon size={20}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </Icon>
);
export const CallIcon = () => (
  <Icon size={20}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </Icon>
);

/** The animated card tapping a phone beside the hero mockup. */
export function TapArt() {
  return (
    <svg className="tapart" width="150" height="120" viewBox="0 0 150 120" aria-hidden="true">
      <g className="tapcard">
        <rect x="8" y="34" width="86" height="56" rx="10" fill="var(--ink)" />
        <rect x="18" y="46" width="30" height="6" rx="3" fill="var(--accent)" />
        <rect x="18" y="58" width="44" height="4" rx="2" fill="white" fillOpacity="0.33" />
        <rect x="18" y="66" width="34" height="4" rx="2" fill="white" fillOpacity="0.2" />
        <path d="M76 52a8 8 0 0 1 0 14M81 48a14 14 0 0 1 0 22" stroke="white" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </g>
      <g fill="none" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" className="waves">
        <path d="M104 46a14 14 0 0 1 0 28" />
        <path d="M112 38a26 26 0 0 1 0 44" />
        <path d="M120 30a38 38 0 0 1 0 60" />
      </g>
    </svg>
  );
}

/** Small drawings above the two columns of the paper-vs-Jibun comparison (desktop). */
export function PaperCardMini() {
  return (
    <svg width="30" height="20" viewBox="0 0 30 20" aria-hidden="true">
      <rect x="1" y="1" width="28" height="18" rx="2" fill="var(--surface)" stroke="var(--paper-line)" strokeWidth="1.5" />
      <path d="M5 7h12M5 11h8" stroke="var(--paper-line)" strokeWidth="1.5" />
    </svg>
  );
}

export function JibunCardMini() {
  return (
    <svg width="30" height="20" viewBox="0 0 30 20" aria-hidden="true">
      <rect width="30" height="20" rx="4" fill="var(--ink)" />
      <rect x="5" y="6" width="9" height="2.5" rx="1.2" fill="var(--accent)" />
      <path d="M21 7a4 4 0 0 1 0 6M23.5 5a7 7 0 0 1 0 10" stroke="white" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}
