import Link from "next/link";
import { BRAND_NAME } from "@/lib/site";

/** Template tagline plus the branding credit. The credit is removed with remove_branding or on CUSTOM pages. */
export function Footer({ tagline, showBranding }: { tagline?: string; showBranding: boolean }) {
  if (!tagline && !showBranding) return null;
  return (
    <footer className="flex flex-col items-center gap-1 pt-4 text-center text-xs text-muted">
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
