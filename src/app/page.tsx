import type { Metadata, Viewport } from "next";
import { MarketingHome } from "@/components/marketing/Home";

export const metadata: Metadata = {
  title: "Jibun — Yourself, One tap away.",
  description: "Jibun NFC digital cards. Tap the card on any phone and your profile opens. No app needed.",
};

export const viewport: Viewport = { themeColor: "#FBF8F3" };

export default function Home() {
  return <MarketingHome />;
}
