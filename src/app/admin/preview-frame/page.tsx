import type { Metadata } from "next";
import { Suspense } from "react";
import { registeredTemplateKeys } from "@/templates/registry";
import { PreviewHost } from "./PreviewHost";

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

/**
 * The page inside the editor's preview iframe. It waits for the editor to post the form's values, then renders
 * the template. The registry is imported here so every template's client components and styles are part of this
 * route's bundle, which the Server Action's output needs.
 */
export default function PreviewFramePage() {
  return (
    <>
      <Suspense fallback={null}>
        <PreviewHost />
      </Suspense>
      <span hidden data-templates={registeredTemplateKeys().length} />
    </>
  );
}
