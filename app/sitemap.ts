import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://sentrixscan.sentriscloud.com";
  const now = new Date();

  const paths: { path: string; changeFrequency: "always" | "hourly" | "monthly"; priority: number }[] = [
    { path: "", changeFrequency: "always", priority: 1 },
    { path: "/blocks", changeFrequency: "always", priority: 0.9 },
    { path: "/validators", changeFrequency: "hourly", priority: 0.8 },
    { path: "/tokens", changeFrequency: "hourly", priority: 0.8 },
    { path: "/leaderboard", changeFrequency: "hourly", priority: 0.7 },
    { path: "/search", changeFrequency: "monthly", priority: 0.5 },
  ];

  // DECISION: emit each path under every locale. Detail pages (block/tx/address) are excluded —
  // the chain history is unbounded and those URLs are discovered via internal linking.
  return paths.flatMap(({ path, changeFrequency, priority }) =>
    routing.locales.map((locale) => ({
      url: `${base}/${locale}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${base}/${l}${path}`]),
        ),
      },
    })),
  );
}
