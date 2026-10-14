import { describe, expect, it } from "vitest";
import { SOCIAL_TYPES, type SocialLink } from "./page-schema";
import { MESSAGING_TYPES, PROFILE_TYPES, buildSocialUrl, groupSocials, messagingLabel } from "./socials";

const link = (type: SocialLink["type"], handle = "x"): SocialLink => ({ type, handle, url: "https://example.com" });

describe("groupSocials", () => {
  it("covers every social type exactly once", () => {
    expect([...PROFILE_TYPES, ...MESSAGING_TYPES].sort()).toEqual([...SOCIAL_TYPES].sort());
  });

  it("splits into profiles and messaging, preserving order", () => {
    const { profiles, messaging } = groupSocials([
      link("whatsapp", "a"),
      link("github", "b"),
      link("linkedin", "c"),
      link("messenger", "d"),
    ]);
    expect(profiles.map((s) => s.handle)).toEqual(["b", "c"]);
    expect(messaging.map((s) => s.handle)).toEqual(["a", "d"]);
  });

  it("returns empty groups for no socials", () => {
    expect(groupSocials([])).toEqual({ profiles: [], messaging: [] });
  });
});

describe("buildSocialUrl", () => {
  it("builds messaging URLs per the PRD", () => {
    expect(buildSocialUrl("messenger", "maria.santos")).toBe("https://m.me/maria.santos");
    expect(buildSocialUrl("whatsapp", "+63 917 123 4567")).toBe("https://wa.me/639171234567");
    expect(buildSocialUrl("viber", "+639171234567")).toBe("viber://chat?number=639171234567");
  });

  it("strips a leading @", () => {
    expect(buildSocialUrl("instagram", "@maria")).toBe("https://www.instagram.com/maria");
  });

  it("passes a full URL through", () => {
    expect(buildSocialUrl("website", "https://maria.example.com")).toBe("https://maria.example.com");
  });

  it("returns null when a URL cannot be derived", () => {
    expect(buildSocialUrl("website", "maria")).toBeNull();
    expect(buildSocialUrl("discord", "maria")).toBeNull();
    expect(buildSocialUrl("whatsapp", "no digits")).toBeNull();
    expect(buildSocialUrl("instagram", "  ")).toBeNull();
  });
});

describe("messagingLabel", () => {
  it('says "Chat" for number-based apps when numbers are hidden', () => {
    expect(messagingLabel(link("whatsapp", "+639171234567"), false)).toBe("Chat");
    expect(messagingLabel(link("viber", "+639171234567"), false)).toBe("Chat");
  });

  it("shows the handle when numbers may be shown, and for non-number apps", () => {
    expect(messagingLabel(link("whatsapp", "+639171234567"), true)).toBe("+639171234567");
    expect(messagingLabel(link("messenger", "maria"), false)).toBe("maria");
  });
});
