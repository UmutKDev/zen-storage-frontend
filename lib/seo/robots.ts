import type { MetadataRoute } from "next";
import { siteConfig } from "./metadata";

export function buildRobots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/storage/", "/account/", "/notifications/"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
