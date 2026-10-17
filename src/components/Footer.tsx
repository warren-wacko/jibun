import Link from "next/link";
import { BRAND_NAME } from "@/lib/site";

const DEFAULT_CLASS = "flex flex-col items-center gap-1 pt-4 text-center text-xs text-muted";

/**
 * Template tagline plus the branding credit. The credit is removed with remove_branding or on
 * CUSTOM pages. `className` replaces the default layout classes.
 */
export function Footer({
  tagline,
  showBranding,
  className,
}: {
  tagline?: string;
  showBranding: boolean;
  className?: string;
}) {
  if (!tagline && !showBranding) return null;
  return (
    <footer className={className ?? DEFAULT_CLASS}>
      {tagline && <p>{tagline}</p>}
      {showBranding && (
        <p>
          Digital card by{" "}
          <Link href="/" className="underline underline-offset-2">
            {BRAND_NAME}
          </Link>
        </p>
      )}
    </footer>
  );
}
