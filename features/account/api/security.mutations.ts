import { accountSecurityApiFactory } from "@/service/factories";
import type {
  PasskeyRegistrationBeginResponseModel,
  PasskeyViewModel,
  TwoFactorBackupCodesResponseModel,
  TwoFactorSetupResponseModel,
} from "@/service/models";

/* ── Sessions ─────────────────────────────────────────────────────────── */

export async function revokeSession(sessionId: string): Promise<void> {
  await accountSecurityApiFactory.revokeSession({ sessionId });
}

export async function logoutOthers(): Promise<void> {
  await accountSecurityApiFactory.logoutOthers();
}

export async function logoutAll(): Promise<void> {
  await accountSecurityApiFactory.logoutAll();
}

/* ── Passkeys ─────────────────────────────────────────────────────────── */

export async function passkeyRegisterBegin(
  deviceName: string,
): Promise<PasskeyRegistrationBeginResponseModel> {
  const res = await accountSecurityApiFactory.passkeyRegisterBegin({
    passkeyRegistrationBeginRequestModel: { DeviceName: deviceName },
  });
  return res.data as unknown as PasskeyRegistrationBeginResponseModel;
}

export async function passkeyRegisterFinish(
  deviceName: string,
  credential: unknown,
): Promise<PasskeyViewModel> {
  const res = await accountSecurityApiFactory.passkeyRegisterFinish({
    passkeyRegistrationFinishRequestModel: {
      DeviceName: deviceName,
      Credential: credential as object,
    },
  });
  return res.data as unknown as PasskeyViewModel;
}

export async function deletePasskey(passkeyId: string): Promise<void> {
  await accountSecurityApiFactory.deletePasskey({ passkeyId });
}

/* ── Two-factor (TOTP) ────────────────────────────────────────────────── */

export async function twoFactorSetup(): Promise<TwoFactorSetupResponseModel> {
  const res = await accountSecurityApiFactory.twoFactorSetup();
  return res.data as unknown as TwoFactorSetupResponseModel;
}

/** Verify the first code to enable 2FA — returns the one-time backup codes. */
export async function twoFactorVerify(
  code: string,
): Promise<TwoFactorBackupCodesResponseModel> {
  const res = await accountSecurityApiFactory.twoFactorVerify({
    twoFactorVerifyRequestModel: { Code: code },
  });
  return res.data as unknown as TwoFactorBackupCodesResponseModel;
}

export async function twoFactorDisable(code: string): Promise<boolean> {
  const res = await accountSecurityApiFactory.twoFactorDisable({
    twoFactorVerifyRequestModel: { Code: code },
  });
  return res.data as unknown as boolean;
}

/** Regenerate backup codes (code-gated) — returns the new one-time codes. */
export async function regenerateBackupCodes(
  code: string,
): Promise<TwoFactorBackupCodesResponseModel> {
  const res = await accountSecurityApiFactory.regenerateBackupCodes({
    twoFactorVerifyRequestModel: { Code: code },
  });
  return res.data as unknown as TwoFactorBackupCodesResponseModel;
}
