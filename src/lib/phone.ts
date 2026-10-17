/**
 * Readable phone number for display. Philippine mobile numbers (+63 9XX XXX XXXX) are grouped;
 * anything else is shown as stored. The link itself always uses the stored E.164 value.
 */
export function formatPhone(e164: string): string {
  const ph = /^\+63(9\d{2})(\d{3})(\d{4})$/.exec(e164);
  return ph ? `+63 ${ph[1]} ${ph[2]} ${ph[3]}` : e164;
}

/**
 * Turns what an admin types ("0917 123 4567", "+63 917-123-4567", "9171234567") into E.164 (+639171234567).
 * Numbers that do not look like a phone number are returned as bare digits so validation can reject them.
 */
export function normalizePhone(input: string, defaultCountry = "63"): string {
  let d = input.trim().replace(/[^\d+]/g, "");
  if (!d) return "";
  if (d.startsWith("00")) d = `+${d.slice(2)}`;
  if (d.startsWith("+")) return `+${d.slice(1).replace(/\+/g, "")}`;
  if (d.startsWith("0")) return `+${defaultCountry}${d.slice(1)}`;
  if (d.startsWith(defaultCountry) && d.length >= defaultCountry.length + 9) return `+${d}`;
  if (defaultCountry === "63" && /^9\d{9}$/.test(d)) return `+63${d}`;
  return d;
}
