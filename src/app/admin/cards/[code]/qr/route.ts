import QRCode from "qrcode";
import { requireAdmin } from "@/lib/admin/auth";
import { qrTargetUrl } from "@/lib/admin/card-urls";
import { normalizeCardCode } from "@/lib/card-code";
import { db } from "@/lib/db";

/**
 * Admin only: the QR code for one specific card (it can be a spare, or a disabled one), to print or send.
 * `?format=png` is a 1024 px PNG for printing; the default is SVG.
 */
export async function GET(request: Request, ctx: RouteContext<"/admin/cards/[code]/qr">) {
  await requireAdmin();
  const { code } = await ctx.params;
  const card = await db.card.findUnique({ where: { code: normalizeCardCode(code) }, select: { code: true } });
  if (!card) return new Response("Not found", { status: 404 });

  const target = qrTargetUrl(card.code);
  const opts = { margin: 2, errorCorrectionLevel: "M" as const, color: { dark: "#000000", light: "#ffffff" } };
  const headers = { "Cache-Control": "private, no-store" };

  if (new URL(request.url).searchParams.get("format") === "png") {
    const png = await QRCode.toBuffer(target, { ...opts, type: "png", width: 1024 });
    return new Response(new Uint8Array(png), {
      headers: { ...headers, "Content-Type": "image/png", "Content-Disposition": `attachment; filename="card-${card.code}-qr.png"` },
    });
  }
  const svg = await QRCode.toString(target, { ...opts, type: "svg" });
  return new Response(svg, { headers: { ...headers, "Content-Type": "image/svg+xml; charset=utf-8" } });
}
