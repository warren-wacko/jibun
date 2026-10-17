import { Anton, Archivo, DM_Sans, Fraunces, IBM_Plex_Mono, Manrope, Playfair_Display, Work_Sans } from "next/font/google";

// Self-hosted at build time by next/font. Archivo's width axis gives the condensed cover headline.
export const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
  preload: false,
});

export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
  preload: false,
});

// The font pairs a Standard page can choose (see templates/font-pairs.ts). `preload: false` keeps them off the
// critical path: the browser downloads one only when the page uses that pair. (next/font reads these options at
// build time, so each call has to be written out in full.)
export const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap", preload: false });
export const dmSans = DM_Sans({ subsets: ["latin"], axes: ["opsz"], variable: "--font-dm-sans", display: "swap", preload: false });
export const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton", display: "swap", preload: false });
export const workSans = Work_Sans({ subsets: ["latin"], variable: "--font-work-sans", display: "swap", preload: false });
export const fraunces = Fraunces({ subsets: ["latin"], axes: ["opsz"], variable: "--font-fraunces", display: "swap", preload: false });
export const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap", preload: false });

/** Every font variable class, so the page can use whichever pair it chose. */
export const FONT_CLASSES = [archivo, plexMono, playfair, dmSans, anton, workSans, fraunces, manrope].map((f) => f.variable).join(" ");
