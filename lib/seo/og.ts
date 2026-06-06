import { siteConfig } from "./metadata";

/** OpenGraph image config; `app/opengraph-image.tsx` renders against this. */
export const ogImageConfig = {
  alt: siteConfig.name,
  size: { width: 1200, height: 630 },
  contentType: "image/png",
  title: siteConfig.name,
} as const;
