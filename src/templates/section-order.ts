/**
 * Order of a page's blocks. A page can have built-in blocks (About, Connect, ...) that depend on the template, and
 * optional sections (services, experience, ...). `style.sectionOrder` lists block ids and section kinds in the order
 * they appear. Templates and the admin editor both use `resolveOrder`, so the page and the editor always agree.
 * This file is safe for client code.
 */
export type BlockDef = { id: string; label: string };

type Layout = {
  blocks: readonly BlockDef[];
  /** Built-in ids in their default order. "$1" and "$2" are where the first and second optional sections go. */
  defaultOrder: readonly string[];
};

const PRO_BLOCKS: readonly BlockDef[] = [
  { id: "about", label: "About" },
  { id: "connect", label: "Connect" },
  { id: "profiles", label: "Profiles to view" },
  { id: "messages", label: "Ways to message" },
];

const NO_BLOCKS: Layout = { blocks: [], defaultOrder: [] };

export const TEMPLATE_LAYOUT: Record<string, Layout> = {
  "pro-classic": { blocks: PRO_BLOCKS, defaultOrder: ["about", "$1", "connect", "$2", "profiles", "messages"] },
  "pro-signature": { blocks: PRO_BLOCKS, defaultOrder: ["about", "$1", "connect", "$2", "profiles", "messages"] },
  "pro-company": { blocks: PRO_BLOCKS, defaultOrder: ["about", "$1", "connect", "$2", "profiles", "messages"] },
  "pro-magazine": {
    blocks: [
      { id: "about", label: "About" },
      { id: "contents", label: "Contents" },
      { id: "connect", label: "Connect" },
      { id: "socials", label: "Socials" },
    ],
    defaultOrder: ["about", "contents", "$1", "connect", "$2", "socials"],
  },
};

export const layoutFor = (templateKey: string): Layout => TEMPLATE_LAYOUT[templateKey] ?? NO_BLOCKS;

/**
 * Templates that already draw optional sections. The editor says so for the others, so nobody expects a section to
 * show on a template whose Standard design is not built yet. Add a template here when its sections are converted.
 */
export const TEMPLATES_WITH_SECTIONS: ReadonlySet<string> = new Set<string>();

/**
 * The full order for a page: built-in block ids and section kinds. With no saved order, the template's default
 * arrangement is used (first section after About, second after Connect, any others at the end). A saved order is
 * kept as far as it is valid; blocks and sections it does not mention are added at the end.
 */
export function resolveOrder(templateKey: string, sectionKinds: readonly string[], saved?: readonly string[]): string[] {
  const layout = layoutFor(templateKey);
  const kinds = [...new Set(sectionKinds)];
  const builtIns = layout.blocks.map((b) => b.id);

  if (saved && saved.length > 0) {
    const valid = new Set([...builtIns, ...kinds]);
    const out: string[] = [];
    for (const token of saved) if (valid.has(token) && !out.includes(token)) out.push(token);
    const defaults = layout.defaultOrder.filter((t) => !t.startsWith("$"));
    for (const id of defaults) if (!out.includes(id)) out.push(id);
    for (const kind of kinds) if (!out.includes(kind)) out.push(kind);
    return out;
  }

  const out: string[] = [];
  for (const token of layout.defaultOrder) {
    if (token.startsWith("$")) {
      const kind = kinds[Number(token.slice(1)) - 1];
      if (kind) out.push(kind);
    } else out.push(token);
  }
  for (const kind of kinds) if (!out.includes(kind)) out.push(kind);
  return out;
}

export function blockLabel(templateKey: string, id: string): string | null {
  return layoutFor(templateKey).blocks.find((b) => b.id === id)?.label ?? null;
}
