import { Bricolage_Grotesque, Inter } from "next/font/google";

// Self-hosted at build time by next/font (the reference loads them from Google). Only the homepage imports these,
// so other routes do not preload them.
export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-jb-display",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-jb-body",
  display: "swap",
});
