import { subscriptionApiFactory } from "@/service/factories";
import type { UserSubscriptionResponseModel } from "@/service/models";

/**
 * The generated `my()` is typed `AxiosPromise<void>` (the spec has no response
 * DTO), but the envelope carries the real `UserSubscriptionResponseModel` —
 * hence the cast.
 */
export async function getMySubscription(): Promise<UserSubscriptionResponseModel> {
  const res = await subscriptionApiFactory.my();
  return res.data as unknown as UserSubscriptionResponseModel;
}
