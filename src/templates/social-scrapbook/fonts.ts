import { Archivo_Black, Caveat, Courier_Prime, Gloock } from "next/font/google";

// Self-hosted at build time by next/font. The scrapbook mixes four faces on purpose: it is the look.
export const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-archivo-black",
  display: "swap",
  preload: false,
});

export const gloock = Gloock({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-gloock",
  display: "swap",
  preload: false,
});

export const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-courier-prime",
  display: "swap",
  preload: false,
});

export const scrapHand = Caveat({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-scrap-hand",
  display: "swap",
  preload: false,
});
