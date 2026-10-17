import type { ReactNode } from "react";

type IconProps = { size?: number; strokeWidth?: number; className?: string };

function Svg({ size = 22, strokeWidth = 1.8, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

// Glyph paths match the Lucide-style set used in the design references.
export const ICON_PATHS = {
  phone:
    "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z",
  mailLine: "m22 7-10 6L2 7",
  message: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  mapPin: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z",
  userPlusBody: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
  userPlusSign: "M19 8v6M22 11h-6",
  check: "M5 12.5l4.5 4.5L19 7.5",
  sunRays:
    "M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  shareTray: "M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7",
  shareArrow: "m16 6-4-4-4 4",
  shareStem: "M12 2v13",
  copyBack: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  arrowUpRight: "M7 17 17 7M8 7h9v9",
  nfc1: "M8.5 8.5a5 5 0 0 1 0 7",
  nfc2: "M12 5.5a9.5 9.5 0 0 1 0 13",
  nfc3: "M15.5 2.5a14 14 0 0 1 0 19",
  building: "M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01",
  badgeNfc: "M8.5 7.5a6 6 0 0 1 0 9M12 5a10 10 0 0 1 0 14M15.5 2.5a14 14 0 0 1 0 19M5 10.5a2 2 0 0 1 0 3",
  plus: "M12 5v14M5 12h14",
  chevronRight: "m9 6 6 6-6 6",
  qrMarks: "M14 14h3v3h-3zM20 14v.01M14 20h.01M17 17h4v4h-4",
  linkA: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
  linkB: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
} as const;

export const PhoneIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d={ICON_PATHS.phone} />
  </Svg>
);

export const MailIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d={ICON_PATHS.mailLine} />
  </Svg>
);

export const MessageIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d={ICON_PATHS.message} />
  </Svg>
);

export const MapPinIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d={ICON_PATHS.mapPin} />
    <circle cx="12" cy="10" r="3" />
  </Svg>
);

export const UserPlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d={ICON_PATHS.userPlusBody} />
    <circle cx="9" cy="7" r="4" />
    <path d={ICON_PATHS.userPlusSign} />
  </Svg>
);

export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d={ICON_PATHS.check} />
  </Svg>
);

export const SunIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d={ICON_PATHS.sunRays} />
  </Svg>
);

export const MoonIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d={ICON_PATHS.moon} />
  </Svg>
);

export const ShareIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d={ICON_PATHS.shareTray} />
    <path d={ICON_PATHS.shareArrow} />
    <path d={ICON_PATHS.shareStem} />
  </Svg>
);

export const CopyIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d={ICON_PATHS.copyBack} />
  </Svg>
);

export const ArrowUpRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d={ICON_PATHS.arrowUpRight} />
  </Svg>
);

export const NfcIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d={ICON_PATHS.nfc1} />
    <path d={ICON_PATHS.nfc2} />
    <path d={ICON_PATHS.nfc3} />
    <circle cx="5" cy="12" r="1" />
  </Svg>
);

export const BuildingIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d={ICON_PATHS.building} />
  </Svg>
);

export const BadgeNfcIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d={ICON_PATHS.badgeNfc} />
  </Svg>
);

export const PlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d={ICON_PATHS.plus} />
  </Svg>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d={ICON_PATHS.chevronRight} />
  </Svg>
);

export const QrIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <path d={ICON_PATHS.qrMarks} />
  </Svg>
);

export const CalendarIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </Svg>
);

export const LinkIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d={ICON_PATHS.linkA} />
    <path d={ICON_PATHS.linkB} />
  </Svg>
);
