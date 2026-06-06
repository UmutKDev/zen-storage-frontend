import type { MetadataRoute } from "next";
import { siteConfig } from "./metadata";

export function buildSitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
