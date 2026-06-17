import { beforeEach, describe, expect, it } from "vitest";
import { useConsentStore } from "@/features/account";

describe("consent store", () => {
  beforeEach(() => {
    localStorage.clear();
    useConsentStore.getState().reset();
  });

  it("defaults: essential on, optional categories off", () => {
    const state = useConsentStore.getState();
    expect(state.essential).toBe(true);
    expect(state.functional).toBe(false);
    expect(state.analytics).toBe(false);
  });

  it("setConsent updates the category and stamps decidedAt", () => {
    useConsentStore.getState().setConsent("analytics", true);
    expect(useConsentStore.getState().analytics).toBe(true);
    expect(useConsentStore.getState().decidedAt).not.toBeNull();
  });

  it("persists the decision to localStorage (survives a refresh)", () => {
    useConsentStore.getState().setConsent("functional", true);
    expect(useConsentStore.getState().functional).toBe(true);
    // The persisted record is what a fresh page load hydrates from on refresh.
    expect(localStorage.getItem("consent")).toContain('"functional":true');
  });
});
