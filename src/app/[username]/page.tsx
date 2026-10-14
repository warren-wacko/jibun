import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { buildTemplateMeta } from "@/lib/page-meta";
import { getPublicPage } from "@/lib/pages";
import { renderTemplate } from "@/templates/registry";

export async function generateMetadata({ params }: PageProps<"/[username]">): Promise<Metadata> {
  const { username } = await params;
  const page = await getPublicPage(username);
  // Client pages are noindex by default (opt-in to indexing is a later feature).
  const robots = { index: false, follow: false };
  if (!page || !page.canView) return { robots };

  const { profile } = page.data;
  const title = profile.title ? `${profile.fullName} · ${profile.title}` : profile.fullName;
  const description = profile.bio ?? profile.title ?? undefined;
  return {
    title,
    description,
    robots,
    openGraph: {
      type: "profile",
      title: profile.fullName,
      description,
      url: buildTemplateMeta(page).pageUrl,
      images: profile.photoUrl ? [{ url: profile.photoUrl }] : [],
    },
  };
}

// `params` is read inside <Suspense> so a username that was not prerendered still gets an
// instant shell; the page is then cached after the first visit and expired when the admin saves.
export default function ClientPage(props: PageProps<"/[username]">) {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <ClientPageContent params={props.params} />
    </Suspense>
  );
}

async function ClientPageContent({ params }: Pick<PageProps<"/[username]">, "params">) {
  const { username } = await params;
  const page = await getPublicPage(username);
  if (!page) notFound();
  if (!page.canView) redirect("/inactive");

  return renderTemplate(page.templateKey, {
    data: page.data,
    theme: page.data.style.theme,
    meta: buildTemplateMeta(page),
  });
}
