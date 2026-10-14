import { after } from "next/server";
import { db } from "@/lib/db";
import { normalizeCardCode } from "@/lib/card-code";
import { isPlanPaid } from "@/lib/plan-term";
import { getClientIp, publicLimiter } from "@/lib/rate-limit";
import { countryFromHeaders, parseSource } from "@/lib/tap";
import { recordTap } from "@/lib/tap-log";

// Every tap enters here. This route is never cached: the card and plan are checked on each request.
const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

// Relative Location, so the redirect is correct behind any proxy or domain.
function redirectTo(path: string) {
  return new Response(null, { status: 302, headers: { Location: path, ...NO_STORE } });
}

async function handle(request: Request, ctx: RouteContext<"/c/[code]">, log: boolean) {
  const ip = getClientIp(request.headers);
  const limit = publicLimiter.check(`tap:${ip}`);
  if (!limit.allowed) {
    return new Response("Too many requests", {
      status: 429,
      headers: { "Retry-After": String(limit.retryAfterSec), ...NO_STORE },
    });
  }

  const { code } = await ctx.params;
  let card;
  try {
    card = await db.card.findUnique({
      where: { code: normalizeCardCode(code) },
      select: {
        id: true,
        status: true,
        page: { select: { id: true, username: true, status: true, paidUntil: true } },
      },
    });
  } catch (error) {
    console.error("tap lookup failed", error);
    return new Response("Temporarily unavailable", { status: 503, headers: { "Retry-After": "30", ...NO_STORE } });
  }

  // Unknown code, lost/disabled card, or lapsed/inactive page: one outcome.
  if (!card || card.status !== "ACTIVE" || !isPlanPaid(card.page)) return redirectTo("/inactive");

  if (log) {
    const input = {
      cardId: card.id,
      pageId: card.page.id,
      source: parseSource(new URL(request.url).searchParams.get("src")),
      userAgent: request.headers.get("user-agent"),
      ip,
      country: countryFromHeaders(request.headers),
    };
    // Runs once the redirect has been sent: logging never delays the tap.
    after(() => recordTap(input));
  }
  return redirectTo(`/${card.page.username}`);
}

export async function GET(request: Request, ctx: RouteContext<"/c/[code]">) {
  return handle(request, ctx, true);
}

// A HEAD probe follows the same checks but is not a tap.
export async function HEAD(request: Request, ctx: RouteContext<"/c/[code]">) {
  return handle(request, ctx, false);
}
