import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Card inactive · ${BRAND_NAME}`,
  robots: { index: false, follow: false },
};

export default function InactivePage() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">This card is not active</h1>
      <p className="text-neutral-700">
        The page behind this card is no longer available. If this is your card, contact {BRAND_NAME} to reactivate it.
      </p>
      {contactEmail && (
        <a
          href={`mailto:${contactEmail}`}
          className="flex min-h-11 items-center rounded-lg bg-neutral-900 px-5 py-3 font-semibold text-white"
        >
          Contact {BRAND_NAME}
        </a>
      )}
      <Link href="/" className="text-sm text-neutral-700 underline underline-offset-2">
        {BRAND_NAME} home
      </Link>
    </main>
  );
}
