import { DM_Mono, Instrument_Serif, Inter_Tight } from "next/font/google";

// Self-hosted at build time by next/font. The serif (regular + italic) is the template's accent voice.
export const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
  preload: false,
});

export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
  preload: false,
});

export const minimalMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-minimal-mono",
  display: "swap",
  preload: false,
});
