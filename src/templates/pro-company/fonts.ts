import { IBM_Plex_Sans, Inter, Manrope, Source_Sans_3, Source_Serif_4 } from "next/font/google";

// Self-hosted at build time by next/font. The Starter design uses one family (Inter).
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

// The font pairs a Standard page can choose (see templates/font-pairs.ts). `preload: false` keeps them off the
// critical path: the browser downloads one only when the page uses that pair. (next/font reads these options at
// build time, so each call has to be written out in full.)
export const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif", display: "swap", preload: false });
export const sourceSans = Source_Sans_3({ subsets: ["latin"], variable: "--font-source-sans", display: "swap", preload: false });
export const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap", preload: false });
export const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex-sans", display: "swap", preload: false });

/** Every font variable class, so the page can use whichever pair it chose. */
export const FONT_CLASSES = [inter, sourceSerif, sourceSans, manrope, plexSans].map((f) => f.variable).join(" ");
