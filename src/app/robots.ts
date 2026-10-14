import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Client pages carry noindex, so crawlers must be able to fetch them to see it.
// Only the admin, API and tap-entry routes are kept out of crawlers entirely.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: ["/admin", "/api", "/c/"] },
    sitemap: undefined,
    host: siteUrl(),
  };
}
