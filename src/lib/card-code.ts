import { randomInt } from "node:crypto";

/** No 0/O or 1/I/L, so a code read off a card can be typed back without mistakes. */
export const CARD_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CARD_CODE_LENGTH = 7;

/** Random, non-sequential card code. The caller must retry on a unique-constraint collision. */
export function generateCardCode(length: number = CARD_CODE_LENGTH): string {
  let code = "";
  for (let i = 0; i < length; i++) code += CARD_CODE_ALPHABET[randomInt(CARD_CODE_ALPHABET.length)];
  return code;
}

/** Codes are written to chips in uppercase; accept any case from the URL. */
export function normalizeCardCode(input: string): string {
  return input.trim().toUpperCase();
}
