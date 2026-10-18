import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderForm } from "@/components/order/OrderForm";
import { SiteFooter, SiteFrame, SiteHeader } from "@/components/marketing/SiteChrome";
import { marketingContact } from "@/lib/marketing";
import { parseOrderLink } from "@/lib/order";

export const metadata: Metadata = {
  title: "Your Jibun card — order form",
  description: "Tell us about you and we will build your Jibun card.",
  robots: { index: false, follow: false },
};

export default function OrderPage({ searchParams }: PageProps<"/order">) {
  return (
    <SiteFrame>
      <SiteHeader />
      <main className="wrap ord" id="top">
        <Suspense fallback={<p className="lead">Loading the form…</p>}>
          <Form searchParams={searchParams} />
        </Suspense>
      </main>
      <SiteFooter />
    </SiteFrame>
  );
}

async function Form({ searchParams }: Pick<PageProps<"/order">, "searchParams">) {
  const link = parseOrderLink(await searchParams);
  return <OrderForm link={link} messenger={marketingContact().cta} />;
}
