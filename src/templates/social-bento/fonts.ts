import { Caveat, DM_Mono, Space_Grotesk } from "next/font/google";

// Self-hosted at build time by next/font. Caveat is only used for the Standard sections' handwriting and the footer.
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
  preload: false,
});

export const bentoHand = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-bento-hand",
  display: "swap",
  preload: false,
});

export const bentoMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-bento-mono",
  display: "swap",
  preload: false,
});
