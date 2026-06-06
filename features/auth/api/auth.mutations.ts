import { authenticationApiFactory } from "@/service/factories";
import type {
  AuthenticationResponseModel,
  LoginCheckResponseModel,
  PasskeyLoginBeginResponseModel,
} from "@/service/models";

/**
 * Typed thin wrappers over the generated Authentication factory. The envelope
 * interceptor already unwraps `{ Result, Status }`, so `res.data` is the bare
 * model (the generated static type still says the wrapper — hence the cast).
 */
export async function loginCheck(
  email: string,
): Promise<LoginCheckResponseModel> {
  const res = await authenticationApiFactory.loginCheck({
    loginCheckRequestModel: { Email: email },
  });
  return res.data as unknown as LoginCheckResponseModel;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthenticationResponseModel> {
  const res = await authenticationApiFactory.login({
    loginRequestModel: { Email: email, Password: password },
  });
  return res.data as unknown as AuthenticationResponseModel;
}

/** Step-3 2FA — carries the session id from the `login` step (the §6 handoff). */
export async function verify2FA(
  code: string,
  sessionId: string,
): Promise<AuthenticationResponseModel> {
  const res = await authenticationApiFactory.verify2FA(
    { twoFactorVerifyRequestModel: { Code: code } },
    { headers: { "X-Session-Id": sessionId } },
  );
  return res.data as unknown as AuthenticationResponseModel;
}

export async function register(
  email: string,
  password: string,
  passwordConfirmation: string,
): Promise<AuthenticationResponseModel> {
  const res = await authenticationApiFactory.register({
    registerRequestModel: {
      Email: email,
      Password: password,
      PasswordConfirmation: passwordConfirmation,
    },
  });
  return res.data as unknown as AuthenticationResponseModel;
}

export async function resetPassword(email: string): Promise<boolean> {
  const res = await authenticationApiFactory.resetPassword({
    resetPasswordRequestModel: { Email: email },
  });
  return res.data as unknown as boolean;
}

/** Passkey login step 1 — WebAuthn challenge/options for the email. */
export async function passkeyLoginBegin(
  email: string,
): Promise<PasskeyLoginBeginResponseModel> {
  const res = await authenticationApiFactory.passkeyLoginBegin({
    passkeyLoginBeginRequestModel: { Email: email },
  });
  return res.data as unknown as PasskeyLoginBeginResponseModel;
}

/** Passkey login step 2 — finish the ceremony; BYPASSES 2FA. */
export async function passkeyLoginFinish(
  email: string,
  credential: unknown,
): Promise<AuthenticationResponseModel> {
  const res = await authenticationApiFactory.passkeyLoginFinish({
    passkeyLoginFinishRequestModel: {
      Email: email,
      Credential: credential as object,
    },
  });
  return res.data as unknown as AuthenticationResponseModel;
}
