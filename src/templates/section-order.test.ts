import { describe, expect, it } from "vitest";
import { TEMPLATE_KEYS } from "./keys";
import { TEMPLATE_LAYOUT, blockLabel, layoutFor, resolveOrder } from "./section-order";

describe("resolveOrder: default arrangement", () => {
  it("puts the first section after About and the second after Connect", () => {
    expect(resolveOrder("pro-classic", ["skills", "experience"])).toEqual(["about", "skills", "connect", "experience", "profiles", "messages"]);
  });

  it("uses the magazine's own blocks", () => {
    expect(resolveOrder("pro-magazine", ["skills", "experience"])).toEqual(["about", "contents", "skills", "connect", "experience", "socials"]);
  });

  it("skips a slot when there is no section for it, and appends extra sections at the end", () => {
    expect(resolveOrder("pro-classic", ["skills"])).toEqual(["about", "skills", "connect", "profiles", "messages"]);
    expect(resolveOrder("pro-classic", [])).toEqual(["about", "connect", "profiles", "messages"]);
    expect(resolveOrder("pro-classic", ["a", "b", "c"])).toEqual(["about", "a", "connect", "b", "profiles", "messages", "c"]);
  });

  it("keeps the section order for templates with no built-in blocks", () => {
    expect(resolveOrder("social-bento", ["interests", "song", "orgs"])).toEqual(["interests", "song", "orgs"]);
    expect(resolveOrder("not-a-template", ["x"])).toEqual(["x"]);
  });

  it("ignores repeated kinds", () => {
    expect(resolveOrder("social-bento", ["song", "song"])).toEqual(["song"]);
  });
});

describe("resolveOrder: a saved order", () => {
  it("is followed", () => {
    const saved = ["connect", "skills", "about", "experience", "messages", "profiles"];
    expect(resolveOrder("pro-classic", ["skills", "experience"], saved)).toEqual(saved);
  });

  it("drops what is no longer valid (a removed section, an unknown id) and repeats", () => {
    expect(resolveOrder("pro-classic", ["skills"], ["gone", "skills", "skills", "about", "connect", "profiles", "messages"])).toEqual([
      "skills",
      "about",
      "connect",
      "profiles",
      "messages",
    ]);
  });

  it("adds blocks and sections it does not mention at the end", () => {
    expect(resolveOrder("pro-classic", ["skills", "stats"], ["skills", "about"])).toEqual(["skills", "about", "connect", "profiles", "messages", "stats"]);
  });

  it("treats an empty saved order as the default", () => {
    expect(resolveOrder("pro-classic", ["skills"], [])).toEqual(resolveOrder("pro-classic", ["skills"]));
  });
});

describe("layouts", () => {
  it("only describe templates that exist, and every default order names real blocks or slots", () => {
    for (const [key, layout] of Object.entries(TEMPLATE_LAYOUT)) {
      expect(TEMPLATE_KEYS, key).toContain(key);
      const ids = new Set(layout.blocks.map((b) => b.id));
      for (const t of layout.defaultOrder) expect(t.startsWith("$") || ids.has(t), `${key}: ${t}`).toBe(true);
      for (const id of ids) expect(layout.defaultOrder, `${key}: ${id}`).toContain(id);
    }
  });

  it("labels blocks", () => {
    expect(blockLabel("pro-classic", "profiles")).toBe("Profiles to view");
    expect(blockLabel("pro-classic", "nope")).toBeNull();
    expect(layoutFor("social-bento").blocks).toEqual([]);
  });
});
