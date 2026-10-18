import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";
import { termsDoc } from "@/lib/legal";
import { marketingContact } from "@/lib/marketing";

export const metadata: Metadata = {
  title: "Terms — Jibun",
  description: "The plain terms for buying and using a Jibun card.",
};

export default function TermsPage() {
  return <LegalPage doc={termsDoc(marketingContact().email)} />;
}
