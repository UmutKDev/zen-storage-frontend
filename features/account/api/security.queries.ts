import { itemsOf } from "@/lib/api";
import { accountSecurityApiFactory } from "@/service/factories";
import type {
  PasskeyViewModel,
  SessionViewModel,
  TwoFactorStatusResponseModel,
} from "@/service/models";

// `itemsOf` normalizes both shapes the backend uses for lists: a bare array, or
// a paginated `{ items, count }` (the generated types mislabel these as arrays).
export async function getSessions(): Promise<SessionViewModel[]> {
  const res = await accountSecurityApiFactory.getSessions();
  return itemsOf<SessionViewModel>(res.data);
}

export async function getPasskeys(): Promise<PasskeyViewModel[]> {
  const res = await accountSecurityApiFactory.getPasskeys();
  return itemsOf<PasskeyViewModel>(res.data);
}

export async function getTwoFactorStatus(): Promise<TwoFactorStatusResponseModel> {
  const res = await accountSecurityApiFactory.twoFactorStatus();
  return res.data as unknown as TwoFactorStatusResponseModel;
}
