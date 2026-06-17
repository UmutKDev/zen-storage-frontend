import { accountApiFactory } from "@/service/factories";
import type {
  AccountChangePasswordRequestModel,
  AccountPutBodyRequestModel,
} from "@/service/models";

export async function editProfile(
  input: AccountPutBodyRequestModel,
): Promise<boolean> {
  const res = await accountApiFactory.edit({
    accountPutBodyRequestModel: input,
  });
  return res.data as unknown as boolean;
}

export async function changePassword(
  input: AccountChangePasswordRequestModel,
): Promise<boolean> {
  const res = await accountApiFactory.changePassword({
    accountChangePasswordRequestModel: input,
  });
  return res.data as unknown as boolean;
}
