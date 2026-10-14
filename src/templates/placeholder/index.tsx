import { groupSocials, messagingLabel } from "@/lib/socials";
import { ThemeScope } from "../ThemeScope";
import type { TemplateProps } from "../types";

/**
 * Plain stand-in used until a real template's design reference arrives.
 * Intentionally unstyled beyond theme tokens: it is not a design.
 */
export function PlaceholderTemplate({ data, theme }: TemplateProps) {
  const { profile, contact, socials, sections, style } = data;
  const { profiles, messaging } = groupSocials(socials);

  return (
    <ThemeScope theme={theme} accent={style.accent}>
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold break-words">{profile.fullName}</h1>
          {profile.title && <p className="text-muted">{profile.title}</p>}
          {profile.company && <p className="text-muted">{profile.company}</p>}
          {profile.bio && <p className="mt-2">{profile.bio}</p>}
        </header>

        {(contact.phone || contact.email) && (
          <div className="flex flex-wrap gap-3">
            {contact.phone && contact.showPhoneNumbers && (
              <a className="min-h-11 rounded-lg bg-accent px-4 py-3 text-on-accent" href={`tel:${contact.phone}`}>
                Call
              </a>
            )}
            {contact.email && (
              <a className="min-h-11 rounded-lg bg-accent px-4 py-3 text-on-accent" href={`mailto:${contact.email}`}>
                Email
              </a>
            )}
          </div>
        )}

        {profiles.length > 0 && (
          <section aria-label="Profiles to view" className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-muted">Profiles to view</h2>
            {profiles.map((s) => (
              <a key={`${s.type}-${s.handle}`} href={s.url} className="min-h-11 rounded-lg border border-line bg-surface px-4 py-3">
                {s.type}: {s.handle}
              </a>
            ))}
          </section>
        )}

        {messaging.length > 0 && (
          <section aria-label="Ways to message" className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-muted">Ways to message</h2>
            {messaging.map((s) => (
              <a key={`${s.type}-${s.handle}`} href={s.url} className="min-h-11 rounded-lg border border-line bg-surface px-4 py-3">
                {s.type}: {messagingLabel(s, contact.showPhoneNumbers)}
              </a>
            ))}
          </section>
        )}

        {sections.length > 0 && (
          <p className="text-sm text-muted">Sections: {sections.map((s) => s.kind).join(", ")}</p>
        )}

        <footer className="pt-4 text-center text-xs text-muted">Digital card by Jibun</footer>
      </main>
    </ThemeScope>
  );
}
