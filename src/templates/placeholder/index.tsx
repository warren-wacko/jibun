import { ActionRow } from "@/components/ActionRow";
import { FeaturedLink } from "@/components/FeaturedLink";
import { Footer } from "@/components/Footer";
import { QrToggle } from "@/components/QrToggle";
import { SaveContact } from "@/components/SaveContact";
import { ShareButton } from "@/components/ShareButton";
import { SocialGrid } from "@/components/SocialGrid";
import { ThemeScope, ThemeToggle } from "../ThemeScope";
import type { TemplateProps } from "../types";

/**
 * Plain stand-in used until a real template's design reference arrives.
 * Intentionally unstyled beyond theme tokens and shared components: it is not a design.
 */
export function PlaceholderTemplate({ data, theme, meta }: TemplateProps) {
  const { profile, contact, featuredLink, socials, sections, style } = data;
  const booking = sections.find((s) => s.kind === "booking");

  return (
    <ThemeScope theme={theme} accent={style.accent}>
      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-8">
        <ThemeToggle />
        <QrToggle
          name={profile.fullName}
          qrHref={meta.qrHref}
          front={
            <header className="flex flex-col gap-1 rounded-lg border border-line bg-surface p-4">
              <h1 className="text-3xl font-bold wrap-break-word">{profile.fullName}</h1>
              {profile.title && <p className="text-muted">{profile.title}</p>}
              {profile.company && <p className="text-muted">{profile.company}</p>}
              {profile.bio && <p className="mt-2">{profile.bio}</p>}
            </header>
          }
        />

        <SaveContact href={meta.vcardHref} />
        <ActionRow contact={contact} bookingUrl={booking?.url} />
        <FeaturedLink link={featuredLink} />
        <SocialGrid socials={socials} showPhoneNumbers={contact.showPhoneNumbers} />
        <ShareButton url={meta.pageUrl} title={profile.fullName} />

        <Footer showBranding={meta.showBranding} />
      </main>
    </ThemeScope>
  );
}
