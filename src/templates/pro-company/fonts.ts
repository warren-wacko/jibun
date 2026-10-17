import { Inter } from "next/font/google";

// Self-hosted at build time by next/font. The Starter design uses one family (Inter); the Standard
// font pairs (Source Serif, Manrope, IBM Plex) are added with the Standard package in Phase 4.
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
