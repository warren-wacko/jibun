import type { VCardPhoto } from "./vcard";

export const MAX_PHOTO_BYTES = 100 * 1024;
const FETCH_TIMEOUT_MS = 3000;

/** https only, and never a loopback, private or IP-literal host (the URL is admin-entered but still fetched by the server). */
export function isSafePhotoUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    return false;
  }
  if (host.includes(":")) return false; // IPv6 literal
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false; // IPv4 literal
  return true;
}

/**
 * Fetch the profile photo for embedding. Returns null (the vCard is built without a photo)
 * on any failure, an unsupported type, or a file over 100 KB.
 */
export async function fetchVCardPhoto(photoUrl: string | undefined): Promise<VCardPhoto | null> {
  if (!photoUrl || !isSafePhotoUrl(photoUrl)) return null;
  try {
    const res = await fetch(photoUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), redirect: "error" });
    if (!res.ok) return null;
    const mime = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    const type = mime === "image/jpeg" ? "JPEG" : mime === "image/png" ? "PNG" : null;
    if (!type) return null;
    const declared = Number(res.headers.get("content-length") ?? 0);
    if (declared > MAX_PHOTO_BYTES) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > MAX_PHOTO_BYTES) return null;
    return { type, base64: buf.toString("base64") };
  } catch {
    return null;
  }
}
