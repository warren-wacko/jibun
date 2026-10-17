import { Caveat, DM_Mono, DM_Sans, Fraunces, Manrope, Plus_Jakarta_Sans, Space_Grotesk, Syne } from "next/font/google";

// Self-hosted at build time by next/font. Caveat is only the handwritten signature (one weight).
export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const caveat = Caveat({
  subsets: ["latin"],
  weight: "600",
  variable: "--font-caveat",
  display: "swap",
});

// The font pairs a Standard page can choose (see templates/font-pairs.ts). `preload: false` keeps them off the
// critical path: the browser downloads one only when the page uses that pair. (next/font reads these options at
// build time, so each call has to be written out in full.)
export const fraunces = Fraunces({ subsets: ["latin"], axes: ["opsz"], variable: "--font-fraunces", display: "swap", preload: false });
export const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap", preload: false });
export const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap", preload: false });
export const syne = Syne({ subsets: ["latin"], variable: "--font-syne", display: "swap", preload: false });
export const dmSans = DM_Sans({ subsets: ["latin"], axes: ["opsz"], variable: "--font-dm-sans", display: "swap", preload: false });

/** Every font variable class, so the page can use whichever pair it chose. */
export const FONT_CLASSES = [jakarta, dmMono, caveat, fraunces, manrope, spaceGrotesk, syne, dmSans].map((f) => f.variable).join(" ");
