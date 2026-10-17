import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { buildTemplateMeta } from "@/lib/page-meta";
import { buildPreviewData, isPreviewEnabled } from "@/lib/preview";
import { hasTemplate, PLACEHOLDER_KEY, renderTemplate } from "@/templates/registry";

export const metadata: Metadata = {
  title: "Template preview",
  robots: { index: false, follow: false },
};

export default function TemplatePreview(props: PageProps<"/preview/[template]">) {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <Preview params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Preview({
  params,
  searchParams,
}: Pick<PageProps<"/preview/[template]">, "params" | "searchParams">) {
  // Checked per request (not at build time) so ENABLE_PREVIEW can be switched on at runtime.
  await connection();
  if (!isPreviewEnabled(process.env)) notFound();

  const { template } = await params;
  if (template !== PLACEHOLDER_KEY && !hasTemplate(template)) notFound();

  const query = await searchParams;
  const pick = (name: string) => {
    const value = query[name];
    return Array.isArray(value) ? value[0] : value;
  };

  const data = buildPreviewData(template, {
    variant: pick("data"),
    theme: pick("theme"),
    accent: pick("accent"),
    design: pick("design"),
    font: pick("font"),
    order: pick("order"),
  });

  // Save Contact and the QR point at the seeded sample card, so those parts work for real.
  const meta = buildTemplateMeta({ username: "maria", tier: pick("design") === "standard" ? "STANDARD" : "STARTER", addOns: [] });
  return renderTemplate(template, { data, theme: data.style.theme, meta });
}
