// Public barrel for the account feature. Consent lands first (P0 privacy);
// profile / security / subscription sub-features arrive in Phase 2.
export { useConsentStore, CONSENT_VERSION } from "./stores/consent.store";
export type { ConsentCategory } from "./stores/consent.store";
export { CookieConsentBanner } from "./components/CookieConsentBanner";

// Phase 2 — the profile hook the shell consumes, account sub-nav, + screens.
export { useProfile } from "./hooks";
export { AccountNav } from "./components/AccountNav";
export { ProfileScreen } from "./screens/ProfileScreen";
export { SecurityScreen } from "./screens/SecurityScreen";
export { SubscriptionScreen } from "./screens/SubscriptionScreen";
