import type { Metadata } from "next";
import Link from "next/link";
import { emptyFormValues } from "@/lib/admin/page-form";
import { PageEditor } from "../_components/PageEditor";

export const metadata: Metadata = { title: "New page" };

export default function NewPage() {
  return (
    <>
      <div className="flex items-baseline justify-between gap-4 pb-4">
        <h1 className="text-xl font-semibold">New page</h1>
        <Link href="/admin/clients" className="inline-flex min-h-10 items-center text-sm underline">
          Back to clients
        </Link>
      </div>
      <PageEditor mode="create" initial={emptyFormValues()} />
    </>
  );
}
