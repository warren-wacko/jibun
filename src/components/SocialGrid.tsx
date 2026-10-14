import type { PageData } from "@/lib/page-schema";
import { SOCIAL_LABELS, groupSocials, messagingLabel } from "@/lib/socials";
import { TILE, gridCols } from "./tile";

type Props = {
  socials: PageData["socials"];
  showPhoneNumbers: boolean;
};

/** "Profiles to view" and "Ways to message". A group with no links is not rendered at all. */
export function SocialGrid({ socials, showPhoneNumbers }: Props) {
  const { profiles, messaging } = groupSocials(socials);
  return (
    <>
      {profiles.length > 0 && (
        <section aria-labelledby="profiles-heading" className="flex flex-col gap-2">
          <h2 id="profiles-heading" className="text-sm font-semibold text-muted">
            Profiles to view
          </h2>
          <ul className={`grid gap-2 ${gridCols(profiles.length)}`}>
            {profiles.map((s) => (
              <li key={`${s.type}-${s.handle}`} className="contents">
                <a href={s.url} className={TILE} target="_blank" rel="noopener noreferrer">
                  <span className="flex flex-col">
                    <span>{SOCIAL_LABELS[s.type]}</span>
                    {s.note && <span className="text-xs font-normal text-muted">{s.note}</span>}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      {messaging.length > 0 && (
        <section aria-labelledby="messaging-heading" className="flex flex-col gap-2">
          <h2 id="messaging-heading" className="text-sm font-semibold text-muted">
            Ways to message
          </h2>
          <ul className={`grid gap-2 ${gridCols(messaging.length)}`}>
            {messaging.map((s) => (
              <li key={`${s.type}-${s.handle}`} className="contents">
                <a href={s.url} className={TILE} target="_blank" rel="noopener noreferrer">
                  <span className="flex flex-col">
                    <span>{SOCIAL_LABELS[s.type]}</span>
                    <span className="text-xs font-normal text-muted">{messagingLabel(s, showPhoneNumbers)}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
