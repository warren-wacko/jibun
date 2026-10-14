import QRCode from "qrcode";
import { getPublicPage } from "@/lib/pages";
import { siteUrl } from "@/lib/site";

const COLORS = { dark: "#000000", light: "#ffffff" };

/**
 * QR of the page's first ACTIVE card URL with the QR source flag, so a scan goes through
 * /c/[code] and counts as card use. `?format=png` returns a PNG; the default is SVG.
 */
export async function GET(request: Request, ctx: RouteContext<"/[username]/qr">) {
  const { username } = await ctx.params;
  const page = await getPublicPage(username);
  if (!page || !page.cardCode || !page.canDownload) return new Response("Not found", { status: 404 });

  const target = `${siteUrl()}/c/${page.cardCode}?src=qr`;
  const headers = { "Cache-Control": "public, max-age=300" };

  if (new URL(request.url).searchParams.get("format") === "png") {
    const png = await QRCode.toBuffer(target, { type: "png", width: 512, margin: 2, errorCorrectionLevel: "M", color: COLORS });
    return new Response(new Uint8Array(png), { headers: { ...headers, "Content-Type": "image/png" } });
  }

  const svg = await QRCode.toString(target, { type: "svg", margin: 2, errorCorrectionLevel: "M", color: COLORS });
  return new Response(svg, { headers: { ...headers, "Content-Type": "image/svg+xml; charset=utf-8" } });
}
