import { TILE_PRIMARY } from "./tile";

/** Downloads the .vcf. Plain link: works on iOS and Android with no client JS. */
export function SaveContact({ href, label = "Save Contact" }: { href: string; label?: string }) {
  return (
    <a href={href} className={TILE_PRIMARY}>
      {label}
    </a>
  );
}
