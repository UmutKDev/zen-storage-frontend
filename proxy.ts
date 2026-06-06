// Next 16.2 rename of `middleware.ts` (exports `proxy`, Node runtime only).
// Thin shim — real logic lives in lib/auth/proxy. `config` must be a static
// literal in THIS file (Next can't statically parse a re-exported config).
export { proxy } from "@/lib/auth/proxy";

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
