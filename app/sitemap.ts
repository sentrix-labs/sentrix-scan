import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://sentrixscan.sentriscloud.com";
  const now = new Date();

  // DECISION: only index top-level pages. Dynamic detail URLs (block/tx/address/token/validator)
  // are intentionally excluded — the chain history is unbounded and these pages are discovered
  // via internal linking, not search engines.
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "always", priority: 1 },
    { url: `${base}/blocks`, lastModified: now, changeFrequency: "always", priority: 0.9 },
    { url: `${base}/validators`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${base}/tokens`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${base}/search`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
