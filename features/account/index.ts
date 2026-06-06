// Public barrel for the account feature. Consent lands first (P0 privacy);
// profile / security / subscription sub-features arrive in Phase 2.
export { useConsentStore, CONSENT_VERSION } from "./stores/consent.store";
export type { ConsentCategory } from "./stores/consent.store";
