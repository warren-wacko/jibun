import type { Metadata } from "next";
import Link from "next/link";
import { NewPageFlow } from "../_components/NewPageFlow";

export const metadata: Metadata = { title: "New page" };

export default function NewPage() {
  return (
    <>
      <div className="flex items-baseline justify-between gap-4 pb-4">
        <h1>New page</h1>
        <Link href="/admin/clients" className="inline-flex min-h-10 items-center text-sm underline">
          Back to clients
        </Link>
      </div>
      <NewPageFlow />
    </>
  );
}
