import {
  Bricolage_Grotesque,
  DM_Sans,
  Fraunces,
  JetBrains_Mono,
  Manrope,
  Space_Grotesk,
  Space_Mono,
  Syne,
} from "next/font/google";

// Self-hosted at build time by next/font; only the weights this design uses. (next/font reads these options at
// build time, so each call has to be written out in full.)
export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-bricolage",
  display: "swap",
  preload: false,
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
});

// The font pairs a Standard page can choose (see templates/font-pairs.ts). `preload: false` keeps them off the
// critical path: the browser downloads one only when the page uses that pair.
export const fraunces = Fraunces({ subsets: ["latin"], axes: ["opsz"], variable: "--font-fraunces", display: "swap", preload: false });
export const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap", preload: false });
export const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap", preload: false });
export const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-space-mono", display: "swap", preload: false });
export const syne = Syne({ subsets: ["latin"], variable: "--font-syne", display: "swap", preload: false });
export const dmSans = DM_Sans({ subsets: ["latin"], axes: ["opsz"], variable: "--font-dm-sans", display: "swap", preload: false });

/** Every font variable class, so the page can use whichever pair it chose. */
export const FONT_CLASSES = [bricolage, jetbrainsMono, fraunces, manrope, spaceGrotesk, spaceMono, syne, dmSans]
  .map((f) => f.variable)
  .join(" ");
