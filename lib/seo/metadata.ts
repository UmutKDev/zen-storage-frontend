import type { Metadata } from "next";
import { APP_NAME } from "@/config/constants";

/** Single site-level config the SEO helpers + app shims read from. */
export const siteConfig = {
  name: APP_NAME,
  description: "Secure, fast cloud storage for your files.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

/** Base metadata; route metadata spreads overrides on top. */
export function buildMetadata(overrides: Metadata = {}): Metadata {
  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
    description: siteConfig.description,
    applicationName: siteConfig.name,
    ...overrides,
  };
}
