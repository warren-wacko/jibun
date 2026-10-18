import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";
import { privacyDoc } from "@/lib/legal";
import { marketingContact } from "@/lib/marketing";

export const metadata: Metadata = {
  title: "Privacy — Jibun",
  description: "What Jibun collects, why, and the choices you have.",
};

export default function PrivacyPage() {
  return <LegalPage doc={privacyDoc(marketingContact().email)} />;
}
