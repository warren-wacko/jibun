import { Archivo, IBM_Plex_Mono } from "next/font/google";

// Self-hosted at build time by next/font. Archivo's width axis gives the condensed cover headline.
export const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});
