import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PageData } from "@/lib/page-schema";
import { ActionRow, buildActions } from "./ActionRow";
import { FeaturedLink } from "./FeaturedLink";
import { Footer } from "./Footer";
import { QrToggle } from "./QrToggle";
import { SocialGrid } from "./SocialGrid";
import { gridCols } from "./tile";

const contact = (over: Partial<PageData["contact"]> = {}): PageData["contact"] => ({
  showPhoneNumbers: true,
  ...over,
});

describe("buildActions", () => {
  it("shows Call, Text and Email when allowed", () => {
    const keys = buildActions(contact({ phone: "+639171234567", sms: true, email: "a@b.co" })).map((a) => a.key);
    expect(keys).toEqual(["call", "text", "email"]);
  });

  it("omits Text unless sms is on", () => {
    expect(buildActions(contact({ phone: "+639171234567" })).map((a) => a.key)).toEqual(["call"]);
  });

  it("hides every phone-number action when showPhoneNumbers is off, but keeps Email", () => {
    const actions = buildActions(contact({ phone: "+639171234567", sms: true, email: "a@b.co", showPhoneNumbers: false }));
    expect(actions.map((a) => a.key)).toEqual(["email"]);
    expect(JSON.stringify(actions)).not.toContain("639171234567");
  });

  it("shows Directions only with an office address, and Book only with a booking url", () => {
    expect(buildActions(contact()).map((a) => a.key)).toEqual([]);
    const keys = buildActions(contact({ officeAddress: "1 Main St, Cavite" }), "https://cal.example.com/x").map((a) => a.key);
    expect(keys).toEqual(["directions", "book"]);
  });

  it("encodes the address in the Directions link", () => {
    const [a] = buildActions(contact({ officeAddress: "1 Main St & 2nd" }));
    expect(a.href).toContain(encodeURIComponent("1 Main St & 2nd"));
  });
});

describe("ActionRow", () => {
  it("renders nothing when there are no actions", () => {
    expect(renderToStaticMarkup(<ActionRow contact={contact()} />)).toBe("");
  });
});

describe("SocialGrid", () => {
  const link = (type: PageData["socials"][number]["type"], handle = "h") => ({ type, handle, url: "https://example.com/x" });

  it("renders nothing for no socials", () => {
    expect(renderToStaticMarkup(<SocialGrid socials={[]} showPhoneNumbers />)).toBe("");
  });

  it("renders only the group that has links", () => {
    const html = renderToStaticMarkup(<SocialGrid socials={[link("github")]} showPhoneNumbers />);
    expect(html).toContain("Profiles to view");
    expect(html).not.toContain("Ways to message");
  });

  it("labels number-based messaging as Chat when numbers are hidden", () => {
    const html = renderToStaticMarkup(
      <SocialGrid socials={[link("whatsapp", "+639171234567")]} showPhoneNumbers={false} />,
    );
    expect(html).toContain("Chat");
    expect(html).not.toContain("+639171234567");
  });

  it("opens external links safely", () => {
    const html = renderToStaticMarkup(<SocialGrid socials={[link("github")]} showPhoneNumbers />);
    expect(html).toContain('rel="noopener noreferrer"');
  });
});

describe("gridCols", () => {
  it("reflows for 1, 2 and 3+ items", () => {
    expect(gridCols(1)).toBe("grid-cols-1");
    expect(gridCols(2)).toBe("grid-cols-2");
    expect(gridCols(3)).toContain("sm:grid-cols-3");
    expect(gridCols(9)).toContain("sm:grid-cols-3");
  });
});

describe("FeaturedLink", () => {
  it("renders nothing without a link", () => {
    expect(renderToStaticMarkup(<FeaturedLink link={undefined} />)).toBe("");
  });

  it("renders the label and url", () => {
    const html = renderToStaticMarkup(
      <FeaturedLink link={{ label: "Follow me", url: "https://example.com/me", icon: "instagram" }} />,
    );
    expect(html).toContain("Follow me");
    expect(html).toContain("Instagram");
    expect(html).toContain('href="https://example.com/me"');
  });
});

describe("Footer", () => {
  it("links the credit to the home page", () => {
    const html = renderToStaticMarkup(<Footer showBranding />);
    expect(html).toContain('href="/"');
    expect(html).toContain("Digital card by");
  });

  it("shows only the tagline when branding is removed, and nothing with neither", () => {
    const html = renderToStaticMarkup(<Footer tagline="Made with care" showBranding={false} />);
    expect(html).toContain("Made with care");
    expect(html).not.toContain("Digital card by");
    expect(renderToStaticMarkup(<Footer showBranding={false} />)).toBe("");
  });
});

describe("QrToggle", () => {
  it("renders both faces with the QR face pre-rotated and backface hidden (never mirrored)", () => {
    const html = renderToStaticMarkup(<QrToggle front={<p>front</p>} qrHref="/maria/qr" name="Maria" />);
    expect(html).toContain("front");
    expect(html).toContain("QR code for Maria");
    expect(html.match(/backface-visibility:hidden/g)?.length).toBe(2);
    expect(html).toContain("rotateY(180deg)");
    expect(html).toContain("Show QR code");
  });
});
