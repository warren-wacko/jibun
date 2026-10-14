import type { PageData } from "@/lib/page-schema";
import { SOCIAL_LABELS } from "@/lib/socials";
import { TILE_PRIMARY } from "./tile";

/** The single hero link ("Follow me on IG"). Renders nothing when the page has none. */
export function FeaturedLink({ link }: { link: PageData["featuredLink"] }) {
  if (!link) return null;
  return (
    <a href={link.url} className={TILE_PRIMARY} target="_blank" rel="noopener noreferrer">
      <span className="flex flex-col">
        <span>{link.label}</span>
        {link.icon && <span className="text-xs font-normal opacity-90">{SOCIAL_LABELS[link.icon]}</span>}
      </span>
    </a>
  );
}
