import { describe, expect, it } from "vitest";
import { drawnKinds, supportedSections } from "./supported-sections";

const ALL = ["gallery", "portfolio", "services", "resume", "experience", "skills", "stats", "video", "booking", "interests", "orgs", "song"] as const;

describe("drawnKinds", () => {
  it("draws every supported kind in the Standard design", () => {
    expect(drawnKinds("pro-classic", ALL, "standard")).toEqual(supportedSections("pro-classic"));
    expect(drawnKinds("social-bento", ALL, "standard")).toEqual(["gallery", "interests", "orgs", "song"].filter((k) => supportedSections("social-bento").includes(k as never)));
  });

  it("draws only what an add-on unlocks in the Starter design", () => {
    expect(drawnKinds("pro-classic", ALL, "starter")).toEqual(["gallery", "resume"]);
    expect(drawnKinds("student-notebook", ALL, "starter")).toEqual(["resume"]);
    expect(drawnKinds("social-minimalist", ALL, "starter")).toEqual(["gallery"]);
  });

  it("never draws a kind the template has no design for, in either design", () => {
    for (const design of ["starter", "standard"] as const) {
      expect(drawnKinds("pro-classic", ["video", "booking"], design)).toEqual([]);
      expect(drawnKinds("not-a-template", ALL, design)).toEqual([]);
    }
  });
});
