import { siteUrl } from "../site";

/** What gets written to the NFC chip: the tap is counted as an NFC tap. */
export const chipUrl = (code: string) => `${siteUrl()}/c/${code}`;

/** What the QR code encodes: the same card, flagged as a QR scan so analytics can tell them apart. */
export const qrTargetUrl = (code: string) => `${siteUrl()}/c/${code}?src=qr`;

export const MAX_CARDS_PER_PAGE = 10;
export const CARD_LABEL_MAX = 40;

export type CardStatusValue = "ACTIVE" | "DISABLED" | "LOST";

export const CARD_STATUS_LABEL: Record<CardStatusValue, string> = {
  ACTIVE: "Active",
  DISABLED: "Disabled",
  LOST: "Lost",
};

/** What a visitor sees when they tap a card in each status. Only an active card works. */
export const CARD_STATUS_HELP: Record<CardStatusValue, string> = {
  ACTIVE: "Works: a tap opens the page.",
  DISABLED: "Switched off for now. A tap shows the “card inactive” page. Can be turned back on.",
  LOST: "Reported lost. A tap shows the “card inactive” page. Can be turned back on if it turns up.",
};

/** Problems with a page's set of cards, worth showing above the list. */
export function cardWarnings(cards: readonly { status: string }[]): string[] {
  const warnings: string[] = [];
  if (cards.length === 0) warnings.push("This page has no cards yet. Add one to get a chip link.");
  else if (!cards.some((c) => c.status === "ACTIVE")) {
    warnings.push("No active card: taps and the page QR code will not work until one is turned on or added.");
  }
  return warnings;
}
