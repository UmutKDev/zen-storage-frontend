/**
 * How the preview modal was reached — drives close navigation. `overlay` =
 * intercepted soft-nav over the folder (close → `router.back()`); `page` =
 * direct load / shared link (close → push to the containing folder).
 */
export type PreviewMode = "overlay" | "page";
