import { getPublicPage } from "@/lib/pages";
import { getClientIp, publicLimiter } from "@/lib/rate-limit";
import { pageUrl } from "@/lib/site";
import { buildVCard } from "@/lib/vcard";
import { fetchVCardPhoto } from "@/lib/vcard-photo";

export async function GET(request: Request, ctx: RouteContext<"/[username]/vcard">) {
  const limit = publicLimiter.check(`vcard:${getClientIp(request.headers)}`);
  if (!limit.allowed) {
    return new Response("Too many requests", { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } });
  }

  const { username } = await ctx.params;
  const page = await getPublicPage(username);
  if (!page || !page.canDownload) return new Response("Not found", { status: 404 });

  const photo = await fetchVCardPhoto(page.data.profile.photoUrl);
  const body = buildVCard(page.data, { pageUrl: pageUrl(page.username), photo });

  return new Response(body, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${page.username}.vcf"`,
      "Cache-Control": "private, no-cache",
    },
  });
}
