import { Caveat, IBM_Plex_Mono, Schibsted_Grotesk } from "next/font/google";

// Self-hosted at build time by next/font. Caveat is the handwriting used on the polaroid, sticky note and footer.
export const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-schibsted",
  display: "swap",
});

export const handwriting = Caveat({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-hand",
  display: "swap",
});

export const notebookMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-notebook-mono",
  display: "swap",
});
