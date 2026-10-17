import { vi } from "vitest";

// next/font/google only works inside the Next.js build; tests get a stand-in that returns
// class/variable names. Add each new template's font functions here.
vi.mock("next/font/google", () => {
  const font = () => ({ className: "font-stub", variable: "font-stub-var", style: { fontFamily: "stub" } });
  return {
    Bricolage_Grotesque: font,
    JetBrains_Mono: font,
    Archivo: font,
    IBM_Plex_Mono: font,
    Inter: font,
    Inter_Tight: font,
    Instrument_Serif: font,
    Schibsted_Grotesk: font,
    Space_Grotesk: font,
    Archivo_Black: font,
    Gloock: font,
    Courier_Prime: font,
    Plus_Jakarta_Sans: font,
    DM_Mono: font,
    Caveat: font,
  };
});
