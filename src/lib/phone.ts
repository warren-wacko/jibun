/**
 * Readable phone number for display. Philippine mobile numbers (+63 9XX XXX XXXX) are grouped;
 * anything else is shown as stored. The link itself always uses the stored E.164 value.
 */
export function formatPhone(e164: string): string {
  const ph = /^\+63(9\d{2})(\d{3})(\d{4})$/.exec(e164);
  return ph ? `+63 ${ph[1]} ${ph[2]} ${ph[3]}` : e164;
}
