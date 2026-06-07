import { accountApiFactory } from "@/service/factories";
import type { AccountProfileResponseModel } from "@/service/models";

/**
 * Typed thin wrappers over the generated Account factory. The envelope
 * interceptor unwraps `{ Result, Status }`, so `res.data` is the bare model
 * (the generated static type still says the wrapper — hence the cast).
 */
export async function getProfile(): Promise<AccountProfileResponseModel> {
  const res = await accountApiFactory.profile();
  return res.data as unknown as AccountProfileResponseModel;
}
