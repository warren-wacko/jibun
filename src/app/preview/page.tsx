import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { isPreviewEnabled } from "@/lib/preview";
import { registeredTemplateKeys } from "@/templates/registry";

export const metadata: Metadata = {
  title: "Template preview",
  robots: { index: false, follow: false },
};

const VIEWS = [
  { label: "Light", query: "theme=light" },
  { label: "Dark", query: "theme=dark" },
  { label: "Light, sparse data", query: "theme=light&data=sparse" },
  { label: "Dark, sparse data", query: "theme=dark&data=sparse" },
  { label: "Standard, light", query: "theme=light&design=standard" },
  { label: "Standard, dark", query: "theme=dark&design=standard" },
];

export default function PreviewIndex() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <PreviewList />
    </Suspense>
  );
}

async function PreviewList() {
  // Checked per request (not at build time) so ENABLE_PREVIEW can be switched on at runtime.
  await connection();
  if (!isPreviewEnabled(process.env)) notFound();

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Template preview</h1>
        <p className="text-neutral-700">
          Every converted template filled with fictional sample data (not the database). Use a phone-sized browser
          window, or open the links on your phone over the same Wi-Fi.
        </p>
        <p className="text-sm text-neutral-600">
          Add <code>?accent=%23D7261E</code> or <code>?accent=graphite</code> to a link to try another accent. Dev only:
          this page is hidden in production.
        </p>
      </header>

      <ul className="flex flex-col gap-4">
        {registeredTemplateKeys().map((key) => (
          <li key={key} className="rounded-lg border border-neutral-300 p-4">
            <h2 className="mb-3 font-semibold">{key}</h2>
            <div className="flex flex-wrap gap-2">
              {VIEWS.map((v) => (
                <Link
                  key={v.query}
                  href={`/preview/${key}?${v.query}`}
                  prefetch={false}
                  className="flex min-h-11 items-center rounded-lg border border-neutral-400 px-3 text-sm"
                >
                  {v.label}
                </Link>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
